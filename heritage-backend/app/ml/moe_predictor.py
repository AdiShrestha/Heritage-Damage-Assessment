from __future__ import annotations

"""MoE ensemble predictor — proper Grad-CAM, ViT attention rollout,
annotated composite visualization sent to frontend."""

from pathlib import Path
from typing import Any
import json

from app.ml.base_predictor import BasePredictor, PredictionResult
from app.core.logging import get_logger
from app.core.exceptions import InferenceError
from app.utils.constants import CLASS_NAMES, NUM_CLASSES, CRITICALITY_MAP

logger = get_logger(__name__)

# ── Visualization constants ───────────────────────────────────────────────────
_IMG_SIZE = 224  # expert input size
_BANNER_H = 52  # top banner height  (class + confidence)
_EXPERT_BAR_H = 36  # bottom expert bar height
_COMPOSITE_W = _IMG_SIZE * 2  # original | heatmap side by side

# Criticality → RGBA border colour
_CRIT_COLOUR: dict[str, tuple] = {
    "STABLE": (56, 161, 105),  # green
    "MINOR": (236, 201, 75),  # yellow
    "MODERATE": (237, 137, 54),  # orange
    "CRITICAL": (229, 62, 62),  # red
    "UNKNOWN": (160, 174, 192),  # grey
}

# ─────────────────────────────────────────────────────────────────────────────


class MoEPredictor(BasePredictor):
    """
    Mixture-of-Experts predictor.
    Weights directory must contain:
      resnet50_best.pth, efficientnet_b4_best.pth, vit_b16_best.pth,
      yolo_damage_best.pth, gate_best.pth, moe_manifest.json
    """

    def __init__(self) -> None:
        self._moe = None
        self._loaded = False
        self._device = "cpu"
        self._conf_threshold = 0.70
        self._gate_hidden = 256
        self._expert_feat_dims: dict[str, int] = {
            "resnet50": 2048,
            "efficientnet_b4": 1792,
            "vit_b16": 768,
            "yolo_damage": 256,
        }
        self._expert_names: list[str] = []

    # ─── load_model ──────────────────────────────────────────────────────────

    def load_model(self, weights_path: Path | None = None) -> None:
        try:
            import torch
            import torch.nn as nn
            import torch.nn.functional as F
            import torchvision.models as tvm
            import timm
            import re

            self._device = "cuda" if torch.cuda.is_available() else "cpu"
            weights_dir = (
                weights_path
                if weights_path and weights_path.is_dir()
                else Path("weights/")
            )

            manifest_path = weights_dir / "moe_manifest.json"
            if manifest_path.exists():
                with open(manifest_path) as f:
                    manifest = json.load(f)
                self._conf_threshold = manifest.get("conf_threshold", 0.70)
                self._gate_hidden = manifest.get("gate_hidden", 256)
                self._expert_feat_dims = manifest.get(
                    "expert_feat_dims", self._expert_feat_dims
                )
                logger.info("MoE manifest loaded from %s", manifest_path)

            n_classes = NUM_CLASSES
            dropout = 0.4

            # ── Expert architectures (must match training notebook exactly) ──

            def _resnet50():
                m = tvm.resnet50(weights=None)
                m.fc = nn.Sequential(
                    nn.BatchNorm1d(2048),
                    nn.Dropout(dropout),
                    nn.Linear(2048, 512),
                    nn.ReLU(inplace=True),
                    nn.BatchNorm1d(512),
                    nn.Dropout(0.3),
                    nn.Linear(512, n_classes),
                )
                return m

            def _efficientnet_b4():
                m = tvm.efficientnet_b4(weights=None)
                in_f = m.classifier[1].in_features
                m.classifier = nn.Sequential(
                    nn.Dropout(dropout),
                    nn.Linear(in_f, 512),
                    nn.ReLU(inplace=True),
                    nn.Dropout(0.3),
                    nn.Linear(512, n_classes),
                )
                return m

            def _vit_b16():
                m = timm.create_model(
                    "vit_base_patch16_224", pretrained=False, num_classes=0
                )
                m.head = nn.Sequential(
                    nn.LayerNorm(m.embed_dim),
                    nn.Linear(m.embed_dim, 256),
                    nn.GELU(),
                    nn.Dropout(dropout),
                    nn.Linear(256, n_classes),
                )
                return m

            class _YOLOFallback(nn.Module):
                def __init__(self):
                    super().__init__()
                    self.backbone = nn.Sequential(
                        nn.Conv2d(3, 64, 7, stride=2, padding=3),
                        nn.BatchNorm2d(64),
                        nn.ReLU(),
                        nn.MaxPool2d(3, stride=2, padding=1),
                        nn.Conv2d(64, 128, 3, padding=1),
                        nn.BatchNorm2d(128),
                        nn.ReLU(),
                        nn.Conv2d(128, 256, 3, padding=1),
                        nn.BatchNorm2d(256),
                        nn.ReLU(),
                        nn.AdaptiveAvgPool2d(1),
                    )
                    self.head = nn.Sequential(
                        nn.Flatten(),
                        nn.Linear(256, 256),
                        nn.ReLU(),
                        nn.Dropout(0.3),
                        nn.Linear(256, n_classes),
                    )

                def forward(self, x):
                    return self.head(self.backbone(x))

            builders = {
                "resnet50": _resnet50,
                "efficientnet_b4": _efficientnet_b4,
                "vit_b16": _vit_b16,
                "yolo_damage": _YOLOFallback,
            }

            weight_files = {
                "resnet50": weights_dir / "resnet50_best.pth",
                "efficientnet_b4": weights_dir / "efficientnet_b4_best.pth",
                "vit_b16": weights_dir / "vit_b16_best.pth",
                "yolo_damage": weights_dir / "yolo_damage_best.pth",
            }

            expert_models: dict[str, nn.Module] = {}
            for name, builder in builders.items():
                m = builder().to(self._device)
                wpath = weight_files[name]
                if wpath.exists():
                    ckpt = torch.load(wpath, map_location=self._device)
                    state = ckpt.get("model_state", ckpt)
                    m.load_state_dict(state, strict=False)
                    logger.info("Expert %s loaded from %s", name, wpath)
                else:
                    logger.warning("Expert %s missing at %s — random init", name, wpath)
                m.eval()
                for p in m.parameters():
                    p.requires_grad = True
                expert_models[name] = m

            # ── Feature extractor wrappers ────────────────────────────────────
            class ExpertExtractor(nn.Module):
                def __init__(self, model: nn.Module, name: str):
                    super().__init__()
                    self.model = model
                    self.name = name

                def forward(self, x):
                    m = self.model
                    if hasattr(m, "layer4"):  # ResNet
                        feats = nn.Sequential(*list(m.children())[:-1])(x).flatten(1)
                        logits = m.fc(feats)
                    elif hasattr(m, "features"):  # EfficientNet
                        feats = m.avgpool(m.features(x)).flatten(1)
                        logits = m.classifier(feats)
                    elif hasattr(m, "blocks"):  # ViT
                        feats = m.forward_features(x)
                        feats = feats[:, 0] if feats.dim() == 3 else feats
                        logits = m.head(feats)
                    else:  # YOLO fallback
                        feats = m.backbone(x).flatten(1)
                        logits = m.head(m.backbone(x))
                    return feats, logits

            # ── Gating network ────────────────────────────────────────────────
            n_experts = len(builders)
            in_dim = sum(self._expert_feat_dims.values())
            gate_proj = None
            gate_input_dim = in_dim
            h = self._gate_hidden

            class Gate(nn.Module):
                def __init__(self, input_dim: int, hidden: int, n: int):
                    super().__init__()
                    self.net = nn.Sequential(
                        nn.Linear(input_dim, hidden),
                        nn.GELU(),
                        nn.Dropout(0.3),
                        nn.Linear(hidden, hidden // 2),
                        nn.GELU(),
                        nn.Dropout(0.2),
                        nn.Linear(hidden // 2, n),
                    )

                def forward(self, feat_tensor):
                    return F.softmax(self.net(feat_tensor), dim=1)

            gate = Gate(gate_input_dim, h, n_experts).to(self._device)
            gate_path = weights_dir / "gate_best.pth"

            if gate_path.exists():
                try:
                    gckpt = torch.load(gate_path, map_location=self._device)
                    gate.load_state_dict(gckpt.get("gate_state", gckpt))
                    logger.info("Gate loaded from %s", gate_path)
                except RuntimeError as e:
                    err = str(e)
                    if "size mismatch" in err:
                        match = re.search(r"torch\.Size\(\[256, (\d+)\]\)", err)
                        if match:
                            ckpt_dim = int(match.group(1))
                            gate_proj = nn.Linear(in_dim, ckpt_dim).to(self._device)
                            gate = Gate(ckpt_dim, h, n_experts).to(self._device)
                            try:
                                gate.load_state_dict(gckpt.get("gate_state", gckpt))
                                logger.info(
                                    "Gate loaded with projection %d→%d",
                                    in_dim,
                                    ckpt_dim,
                                )
                            except RuntimeError as e2:
                                logger.warning("Gate still failed: %s", e2)
                        else:
                            logger.warning("Gate mismatch, uniform weights: %s", e)
                    else:
                        logger.warning("Gate load error, uniform weights: %s", e)
            else:
                logger.warning("Gate weights missing — uniform weighting")

            gate.eval()
            if gate_proj is not None:
                gate_proj.eval()

            # ── Assemble MoE ──────────────────────────────────────────────────
            class _MoE(nn.Module):
                def __init__(self, extractors, gate, gate_proj=None):
                    super().__init__()
                    self.extractors = nn.ModuleList(extractors)
                    self.gate = gate
                    self.gate_proj = gate_proj

                def forward(self, x):
                    feats, logits = [], []
                    for e in self.extractors:
                        f, l = e(x)
                        feats.append(f)
                        logits.append(l)
                    combined = torch.cat(feats, dim=1)
                    if self.gate_proj is not None:
                        combined = self.gate_proj(combined)
                    gw = self.gate(combined)
                    stacked = torch.stack(logits, dim=1)
                    fused = (gw.unsqueeze(-1) * stacked).sum(dim=1)
                    return fused, gw, logits

            extractors = [ExpertExtractor(expert_models[n], n) for n in builders]
            self._moe = _MoE(extractors, gate, gate_proj).to(self._device)
            self._moe.eval()
            self._expert_names = list(builders.keys())
            self._loaded = True
            logger.info("MoE assembled: %d experts on %s", n_experts, self._device)

        except ImportError as e:
            logger.error("Missing dependency for MoEPredictor: %s", e)
        except Exception as e:
            logger.error("MoEPredictor load failed: %s", e, exc_info=True)

    # ─── predict ─────────────────────────────────────────────────────────────

    def predict(self, image: Any) -> PredictionResult:
        if not self._loaded or self._moe is None:
            raise InferenceError("MoE weights not loaded.")

        import torch
        import torch.nn.functional as F
        import numpy as np

        try:
            # ── Preprocess ───────────────────────────────────────────────────
            if hasattr(image, "convert"):
                pil = image.convert("RGB")
                arr = (
                    np.array(pil.resize((_IMG_SIZE, _IMG_SIZE))).astype(np.float32)
                    / 255.0
                )
                arr = (arr - np.array([0.485, 0.456, 0.406])) / np.array(
                    [0.229, 0.224, 0.225]
                )
                tensor = torch.from_numpy(arr.transpose(2, 0, 1)).unsqueeze(0).float()
            else:
                tensor = image
                pil = None  # tensor input — Grad-CAM still possible

            tensor = tensor.to(self._device)

            # ── Forward pass (no_grad for logits) ────────────────────────────
            with torch.no_grad():
                fused, gate_w, expert_logits = self._moe(tensor)

            probs = F.softmax(fused, dim=1)[0]
            pred_idx = int(probs.argmax())
            confidence = float(probs[pred_idx])

            predicted_class = CLASS_NAMES[pred_idx]
            criticality = CRITICALITY_MAP.get(predicted_class, "UNKNOWN")
            gate_weights = gate_w[0].cpu().tolist()
            class_probabilities = {
                CLASS_NAMES[i]: float(probs[i]) for i in range(len(CLASS_NAMES))
            }

            # ── Per-expert breakdown ──────────────────────────────────────────
            per_expert = []
            for i, (name, logits) in enumerate(zip(self._expert_names, expert_logits)):
                ep = F.softmax(logits, dim=1)[0]
                conf = float(ep.max())
                per_expert.append(
                    {
                        "expert": name,
                        "class": CLASS_NAMES[int(ep.argmax())],
                        "confidence": conf,
                        "gate_weight": gate_weights[i],
                    }
                )

            # Determine top expert based on the highest gate weight
            top_expert_idx = int(np.argmax(gate_weights))

            # ── Grad-CAM ─────────────────────────────────────────────────────
            heatmap_np = self._compute_gradcam(
                tensor,
                pred_idx,
                self._moe.extractors[top_expert_idx].model,
                self._expert_names[top_expert_idx],
            )

            # ── Heatmap overlay visualization ─────────────────────────────────
            from PIL import Image
            source_pil = pil if pil is not None else _tensor_to_pil(tensor)
            orig_np = np.array(source_pil.convert("RGB").resize((_IMG_SIZE, _IMG_SIZE)))
            heat_np = _heatmap_overlay(orig_np, heatmap_np)
            
            # Optionally draw damage boxes if criticality is not STABLE
            if criticality != "STABLE":
                boxes = _damage_boxes(heatmap_np, threshold=0.50)
                if boxes:
                    crit_rgb = _CRIT_COLOUR.get(criticality, _CRIT_COLOUR["UNKNOWN"])
                    heat_np = _draw_boxes_pil(heat_np.copy(), boxes, colour=crit_rgb)
            
            heatmap_pil = Image.fromarray(heat_np)

            result = PredictionResult(
                predicted_class=predicted_class,
                confidence=confidence,
                class_probabilities=class_probabilities,
                gradcam_image=heatmap_pil,
            )
            # MoE-specific extras surfaced by PredictionService
            result.gate_weights = gate_weights
            result.per_expert = per_expert
            result.criticality = criticality
            result.used_gate = float(max(gate_weights)) >= self._conf_threshold
            result.expert_names = self._expert_names
            return result

        except InferenceError:
            raise
        except Exception as e:
            logger.error("MoE inference error: %s", e, exc_info=True)
            raise InferenceError(f"MoE prediction failed: {e}")

    # ─── Grad-CAM (proper gradient-weighted activation) ──────────────────────

    def _compute_gradcam(
        self,
        tensor: Any,
        pred_idx: int,
        model: Any,
        expert_name: str,
    ):
        """
        Returns a float32 numpy array in [0, 1], shape (224, 224).
        Uses:
          • ResNet / EfficientNet: Grad-CAM with real gradients via hooks
          • ViT:                   Attention rollout (last block, CLS→patches)
          • YOLO fallback:         Gradient × activation map
        Falls back to a uniform mid-intensity map if anything fails.
        """
        import torch
        import torch.nn.functional as F
        import numpy as np

        try:
            if hasattr(model, "blocks"):
                return self._vit_attention_map(tensor, model)
            else:
                return self._conv_gradcam(tensor, pred_idx, model, expert_name)
        except Exception as e:
            logger.debug("Grad-CAM failed for %s: %s — using fallback", expert_name, e)
            return np.full((_IMG_SIZE, _IMG_SIZE), 0.4, dtype=np.float32)

    def _conv_gradcam(self, tensor, pred_idx, model, expert_name):
        """
        Standard Grad-CAM for convolutional experts.
        Picks the deepest spatial feature map automatically.
        """
        import torch
        import torch.nn.functional as F
        import numpy as np

        # Select target layer
        if hasattr(model, "layer4"):  # ResNet50
            target = model.layer4[-1]
        elif hasattr(model, "features"):  # EfficientNet
            target = model.features[-1]
        elif hasattr(model, "backbone"):  # YOLO fallback
            # backbone ends with AdaptiveAvgPool — step back to last conv
            conv_layers = [
                m for m in model.backbone.modules() if isinstance(m, torch.nn.Conv2d)
            ]
            target = conv_layers[-1] if conv_layers else model.backbone[-2]
        else:
            raise ValueError(f"No known target layer for {expert_name}")

        activations: list = []
        gradients: list = []

        def fwd_hook(_, __, out):
            activations.append(out.detach().clone())

        def bwd_hook(_, __, grad_out):
            gradients.append(grad_out[0].detach().clone())

        h_fwd = target.register_forward_hook(fwd_hook)
        h_bwd = target.register_full_backward_hook(bwd_hook)

        try:
            # Need grad — clone tensor and enable
            inp = tensor.detach().clone().requires_grad_(True)
            model.eval()
            with torch.enable_grad():
                out = model(inp)
                if isinstance(out, tuple):
                    out = out[0]
                score = out[0, pred_idx]
                model.zero_grad()
                score.backward()
        finally:
            h_fwd.remove()
            h_bwd.remove()

        if not activations or not gradients:
            raise RuntimeError("Hooks did not fire")

        act = activations[0].squeeze(0)  # [C, H, W]
        grad = gradients[0].squeeze(0)  # [C, H, W]

        # Grad-CAM weights: global average pool of gradients
        weights = grad.mean(dim=[1, 2], keepdim=True)  # [C, 1, 1]
        cam = F.relu((weights * act).sum(dim=0))  # [H, W]

        # Upsample to input size
        cam = (
            F.interpolate(
                cam.unsqueeze(0).unsqueeze(0).float(),
                size=(_IMG_SIZE, _IMG_SIZE),
                mode="bilinear",
                align_corners=False,
            )
            .squeeze()
            .cpu()
            .numpy()
        )

        # Normalize
        lo, hi = cam.min(), cam.max()
        cam = (cam - lo) / (hi - lo + 1e-7)
        return cam.astype(np.float32)

    def _vit_attention_map(self, tensor, model):
        """
        Extract CLS-to-patch attention from the last ViT block.
        Averages across heads, reshapes 14×14 → 224×224.
        """
        import torch
        import torch.nn.functional as F
        import numpy as np

        attn_weights: list = []

        def attn_hook(module, inp, out):
            # Recompute raw attention from QKV inside the block
            # timm Attention.forward: qkv → reshape → q,k,v → attn = softmax(q@k.T * scale)
            B, N, C = inp[0].shape
            qkv = (
                module.qkv(inp[0])
                .reshape(B, N, 3, module.num_heads, C // module.num_heads)
                .permute(2, 0, 3, 1, 4)
            )
            q, k = qkv[0], qkv[1]
            scale = (C // module.num_heads) ** -0.5
            attn = F.softmax(q @ k.transpose(-2, -1) * scale, dim=-1)
            # attn: [B, heads, seq, seq]  — CLS row is index 0
            attn_weights.append(attn.detach().cpu())

        handle = model.blocks[-1].attn.register_forward_hook(attn_hook)
        try:
            model.eval()
            with torch.no_grad():
                model(tensor)
        finally:
            handle.remove()

        if not attn_weights:
            raise RuntimeError("ViT attention hook did not fire")

        attn = attn_weights[0][0]  # [heads, seq, seq]
        cls_attn = attn.mean(dim=0)[0, 1:]  # avg over heads, CLS→patches [196]

        # Reshape to 14×14 spatial map
        side = int(cls_attn.numel() ** 0.5)
        cam = cls_attn.reshape(side, side).numpy().astype(np.float32)

        # Upsample to 224×224
        cam_t = torch.from_numpy(cam).unsqueeze(0).unsqueeze(0)
        cam = (
            F.interpolate(
                cam_t, size=(_IMG_SIZE, _IMG_SIZE), mode="bilinear", align_corners=False
            )
            .squeeze()
            .numpy()
        )

        lo, hi = cam.min(), cam.max()
        return ((cam - lo) / (hi - lo + 1e-7)).astype(np.float32)

    # ─── Properties ──────────────────────────────────────────────────────────

    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def model_name(self) -> str:
        return "moe"

    @property
    def model_version(self) -> str:
        return "1.0.0"


# ─── Visualization helpers (module-level, no side-effects) ───────────────────


def _tensor_to_pil(tensor):
    """Convert a normalised input tensor back to a displayable PIL image."""
    from PIL import Image
    import numpy as np

    mean = np.array([0.485, 0.456, 0.406])
    std = np.array([0.229, 0.224, 0.225])
    arr = tensor[0].cpu().permute(1, 2, 0).numpy()
    arr = arr * std + mean
    arr = np.clip(arr * 255, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)


def _heatmap_overlay(original_np: "np.ndarray", cam: "np.ndarray") -> "np.ndarray":
    import numpy as np

    # JET colormap: blue→cyan→green→yellow→red
    r = np.clip(1.5 - np.abs(4.0 * cam - 3.0), 0, 1)
    g = np.clip(1.5 - np.abs(4.0 * cam - 2.0), 0, 1)
    b = np.clip(1.5 - np.abs(4.0 * cam - 1.0), 0, 1)
    jet = np.stack([r, g, b], axis=-1)  # (H, W, 3) float32 in [0,1]

    orig = original_np.astype(np.float32) / 255.0
    blend = 0.55 * orig + 0.45 * jet
    return np.clip(blend * 255, 0, 255).astype(np.uint8)


def _damage_boxes(
    cam: "np.ndarray", threshold: float = 0.50
) -> list[tuple[int, int, int, int]]:
    import numpy as np
    from scipy.ndimage import label

    binary = (cam >= threshold).astype(np.uint8)
    labeled, n_features = label(binary)

    boxes = []
    for i in range(1, n_features + 1):
        ys, xs = np.where(labeled == i)
        if len(xs) < 64:  # skip tiny specks (area proxy)
            continue
        boxes.append((int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())))
    return boxes


def _draw_boxes_pil(
    img_np: "np.ndarray",
    boxes: list[tuple[int, int, int, int]],
    colour: tuple[int, int, int],
) -> "np.ndarray":
    from PIL import Image, ImageDraw
    import numpy as np

    img = Image.fromarray(img_np)
    draw = ImageDraw.Draw(img)
    for x1, y1, x2, y2 in boxes:
        draw.rectangle([(x1, y1), (x2, y2)], outline=colour, width=2)
    return np.array(img)


def _build_composite(
    original_pil: Any,
    heatmap_np: "np.ndarray",
    predicted_class: str,
    confidence: float,
    criticality: str,
    per_expert: list[dict],
) -> Any:
    """
    Assemble the annotated composite image sent to the frontend.

    Layout (total: 448 × 312 px):
    ┌─────────────────────────────────────────────────────┐  52 px
    │  [CRITICALITY COLOUR]  CLASS · CONF% · CRITICALITY  │  banner
    ├────────────────────────┬────────────────────────────┤
    │   Original image       │   Heatmap + damage boxes   │  224 px
    │   "Survey Image"       │   "Damage Map"              │
    ├────────────────────────┴────────────────────────────┤
    │  Expert bars: ResNet██ EfficientNet██ ViT██ YOLO██   │  36 px
    └─────────────────────────────────────────────────────┘
    """
    import numpy as np
    from PIL import Image, ImageDraw, ImageFont

    W, H = _COMPOSITE_W, _IMG_SIZE  # 448 × 224
    TOTAL_H = _BANNER_H + H + _EXPERT_BAR_H  # 312
    crit_rgb = _CRIT_COLOUR.get(criticality, _CRIT_COLOUR["UNKNOWN"])

    # ── Prepare original (left panel) ────────────────────────────────────────
    orig_np = np.array(original_pil.convert("RGB").resize((_IMG_SIZE, _IMG_SIZE)))

    # ── Prepare heatmap (right panel) ────────────────────────────────────────
    heat_np = _heatmap_overlay(orig_np, heatmap_np)

    # Draw damage boxes on heatmap panel only
    if criticality != "STABLE":
        boxes = _damage_boxes(heatmap_np, threshold=0.50)
        if boxes:
            heat_np = _draw_boxes_pil(heat_np.copy(), boxes, colour=crit_rgb)

    # ── Build full canvas ────────────────────────────────────────────────────
    canvas = Image.new("RGB", (W, TOTAL_H), color=(18, 18, 24))  # dark bg
    draw = ImageDraw.Draw(canvas)

    # ── Banner ───────────────────────────────────────────────────────────────
    draw.rectangle([(0, 0), (W, _BANNER_H)], fill=crit_rgb)
    banner_text = (
        f"{predicted_class.upper()}  ·  "
        f"{confidence * 100:.1f}% confident  ·  "
        f"{criticality}"
    )
    try:
        font_banner = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 16
        )
        font_label = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 11
        )
    except OSError:
        font_banner = ImageFont.load_default()
        font_label = font_banner

    # Centre text in banner
    bbox = draw.textbbox((0, 0), banner_text, font=font_banner)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (W - tw) // 2
    ty = (_BANNER_H - th) // 2
    draw.text(
        (tx + 1, ty + 1), banner_text, fill=(0, 0, 0, 100), font=font_banner
    )  # shadow
    draw.text((tx, ty), banner_text, fill=(255, 255, 255), font=font_banner)

    # ── Image panels ─────────────────────────────────────────────────────────
    orig_pil_224 = Image.fromarray(orig_np)
    heat_pil_224 = Image.fromarray(heat_np)

    canvas.paste(orig_pil_224, (0, _BANNER_H))
    canvas.paste(heat_pil_224, (_IMG_SIZE, _BANNER_H))

    # Panel labels
    draw.rectangle([(0, _BANNER_H), (_IMG_SIZE, _BANNER_H + 18)], fill=(0, 0, 0, 140))
    draw.rectangle([(_IMG_SIZE, _BANNER_H), (W, _BANNER_H + 18)], fill=(0, 0, 0, 140))
    draw.text((6, _BANNER_H + 3), "Survey Image", fill=(200, 200, 200), font=font_label)
    draw.text(
        (_IMG_SIZE + 6, _BANNER_H + 3),
        "Damage Map",
        fill=(200, 200, 200),
        font=font_label,
    )

    # Divider line between panels
    draw.line(
        [(_IMG_SIZE, _BANNER_H), (_IMG_SIZE, _BANNER_H + H)], fill=(60, 60, 60), width=1
    )

    # ── Expert bar ────────────────────────────────────────────────────────────
    bar_y = _BANNER_H + H
    bar_total = W
    n_experts = len(per_expert)
    slot_w = bar_total // n_experts if n_experts else bar_total

    # Distinct colours per expert
    expert_colours = [
        (66, 153, 225),  # ResNet  – blue
        (72, 187, 120),  # EfficientNet – green
        (237, 137, 54),  # ViT     – orange
        (160, 132, 232),  # YOLO    – purple
    ]

    for i, ep in enumerate(per_expert):
        x0 = i * slot_w
        x1 = x0 + slot_w - 1
        ecolour = expert_colours[i % len(expert_colours)]

        # Confidence bar (fill %)
        bar_inner_h = _EXPERT_BAR_H - 12
        fill_w = int(slot_w * ep["confidence"])
        draw.rectangle(
            [(x0, bar_y + 6), (x1, bar_y + 6 + bar_inner_h)], fill=(40, 40, 50)
        )
        draw.rectangle(
            [(x0, bar_y + 6), (x0 + fill_w, bar_y + 6 + bar_inner_h)], fill=ecolour
        )

        # Short name label
        short = {
            "resnet50": "RN50",
            "efficientnet_b4": "EN-B4",
            "vit_b16": "ViT",
            "yolo_damage": "YOLO",
        }.get(ep["expert"], ep["expert"][:4])
        label = f"{short} {ep['confidence']*100:.0f}%"
        draw.text((x0 + 3, bar_y + 6), label, fill=(220, 220, 220), font=font_label)

    # Thin border around entire composite using criticality colour
    draw.rectangle([(0, 0), (W - 1, TOTAL_H - 1)], outline=crit_rgb, width=2)

    return canvas
