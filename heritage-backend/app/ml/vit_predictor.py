from __future__ import annotations

"""ViT-B/16 predictor — correct checkpoint loading + full inference."""

from pathlib import Path
from typing import Any

from app.ml.base_predictor import BasePredictor, PredictionResult
from app.core.exceptions import InferenceError
from app.core.logging import get_logger
from app.utils.constants import CLASS_NAMES, NUM_CLASSES

logger = get_logger(__name__)


class ViTPredictor(BasePredictor):
    def __init__(self) -> None:
        self._model = None
        self._loaded = False
        self._device = "cpu"
        self._epoch: int | None = None

    def load_model(self, weights_path: Path | None = None) -> None:
        try:
            import torch
            import torch.nn as nn
            import timm

            self._device = "cuda" if torch.cuda.is_available() else "cpu"

            if weights_path is None or not weights_path.exists():
                logger.warning("ViT weights not found at %s — inactive.", weights_path)
                return

            # Build with num_classes=0 then attach custom head — matches training notebook
            model = timm.create_model(
                "vit_base_patch16_224", pretrained=False, num_classes=0
            )
            model.head = nn.Sequential(
                nn.LayerNorm(model.embed_dim),
                nn.Linear(model.embed_dim, 256),
                nn.GELU(),
                nn.Dropout(0.4),
                nn.Linear(256, NUM_CLASSES),
            )

            # ── Extract model_state from checkpoint wrapper ───────────────────
            ckpt = torch.load(weights_path, map_location=self._device)
            state = ckpt.get("model_state", ckpt)
            model.load_state_dict(state, strict=True)
            self._epoch = int(ckpt.get("epoch", -1)) + 1
            model.eval()

            self._model = model.to(self._device)
            self._loaded = True
            logger.info("ViT-B/16 loaded from %s on %s", weights_path, self._device)

        except Exception as exc:
            logger.error("ViT load FAILED: %s", exc, exc_info=True)
            self._loaded = False
            self._model = None

    def predict(self, image: Any) -> PredictionResult:
        if not self._loaded or self._model is None:
            raise InferenceError("ViT weights not loaded.")

        import numpy as np
        import torch
        from PIL import Image

        if hasattr(image, "convert"):
            pil = image.convert("RGB").resize((224, 224), Image.Resampling.LANCZOS)
            arr = np.array(pil).astype(np.float32) / 255.0
            mean = np.array([0.485, 0.456, 0.406])
            std = np.array([0.229, 0.224, 0.225])
            tensor = (
                torch.from_numpy(((arr - mean) / std).transpose(2, 0, 1))
                .unsqueeze(0)
                .float()
                .to(self._device)
            )
        else:
            tensor = image.to(self._device)

        self._model.eval()
        with torch.no_grad():
            feats = self._model.forward_features(tensor)
            feats = feats[:, 0] if feats.dim() == 3 else feats  # CLS token
            logits = self._model.head(feats)

        probs = torch.softmax(logits[0], dim=0).cpu().numpy()
        pred_idx = int(probs.argmax())

        gradcam_image = None
        try:
            gradcam_image = self._attention_map(
                tensor, image if hasattr(image, "convert") else None
            )
        except Exception as e:
            logger.debug("ViT attention map skipped: %s", e)

        return PredictionResult(
            predicted_class=CLASS_NAMES[pred_idx],
            confidence=float(probs[pred_idx]),
            class_probabilities={CLASS_NAMES[i]: float(p) for i, p in enumerate(probs)},
            gradcam_image=gradcam_image,
        )

    def _attention_map(self, tensor, original_pil):
        """CLS→patch attention from last transformer block.

        Handles both old timm (qkv attribute) and new timm (fused_attn).
        Falls back to a gradient-based approach if attention extraction fails.
        """
        import torch
        import torch.nn.functional as F
        import numpy as np
        from PIL import Image

        attn_weights: list = []

        def hook(module, inp, out):
            try:
                # timm < 0.9: Attention has a `qkv` linear layer
                if hasattr(module, "qkv"):
                    B, N, C = inp[0].shape
                    qkv = (
                        module.qkv(inp[0])
                        .reshape(B, N, 3, module.num_heads, C // module.num_heads)
                        .permute(2, 0, 3, 1, 4)
                    )
                    q, k = qkv[0], qkv[1]
                    scale = (C // module.num_heads) ** -0.5
                    attn = F.softmax(q @ k.transpose(-2, -1) * scale, dim=-1)
                    attn_weights.append(attn.detach().cpu())
                # timm >= 0.9 with fused_attn: out is already [B, heads, seq, seq] or
                # the module stores attn_weight internally — capture from out instead
                elif isinstance(out, torch.Tensor) and out.dim() == 3:
                    # out is [B, N, C] — recompute from Q/K if possible
                    pass  # will rely on fallback below
            except Exception:
                pass  # hook failure is non-fatal; _attention_map handles empty list

        handle = self._model.blocks[-1].attn.register_forward_hook(hook)
        try:
            self._model.eval()
            with torch.no_grad():
                self._model(tensor)
        finally:
            handle.remove()

        if not attn_weights:
            # Fallback: use gradient norm as a proxy saliency map
            logger.debug("ViT attention hook returned no weights — using gradient fallback")
            return self._gradient_saliency(tensor, original_pil)

        attn = attn_weights[0][0]  # [heads, seq, seq]
        cls_attn = attn.mean(dim=0)[0, 1:]  # [196]
        side = int(cls_attn.numel() ** 0.5)  # 14
        cam = cls_attn.reshape(side, side).numpy().astype(np.float32)
        cam = (
            F.interpolate(
                torch.from_numpy(cam).unsqueeze(0).unsqueeze(0),
                size=(224, 224),
                mode="bilinear",
                align_corners=False,
            )
            .squeeze()
            .numpy()
        )
        cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-7)

        if original_pil is None:
            return None
        orig = (
            np.array(original_pil.convert("RGB").resize((224, 224))).astype(np.float32)
            / 255.0
        )
        r = np.clip(1.5 - np.abs(4.0 * cam - 3.0), 0, 1)
        g = np.clip(1.5 - np.abs(4.0 * cam - 2.0), 0, 1)
        b = np.clip(1.5 - np.abs(4.0 * cam - 1.0), 0, 1)
        blend = np.clip(0.55 * orig + 0.45 * np.stack([r, g, b], axis=-1), 0, 1)
        return Image.fromarray((blend * 255).astype(np.uint8))

    def _gradient_saliency(self, tensor, original_pil):
        """Gradient-based fallback when attention hooks don't fire."""
        import torch
        import torch.nn.functional as F
        import numpy as np
        from PIL import Image

        SIZE = 224
        inp = tensor.detach().clone().requires_grad_(True)
        self._model.eval()
        with torch.enable_grad():
            feats = self._model.forward_features(inp)
            feats = feats[:, 0] if feats.dim() == 3 else feats
            logits = self._model.head(feats)
            score = logits[0, logits[0].argmax()]
            self._model.zero_grad()
            score.backward()

        if inp.grad is None:
            return None

        # Gradient magnitude over channels → saliency
        sal = inp.grad[0].abs().mean(dim=0).cpu().numpy()
        sal = (sal - sal.min()) / (sal.max() - sal.min() + 1e-7)
        sal_t = torch.from_numpy(sal).unsqueeze(0).unsqueeze(0)
        sal = (
            F.interpolate(sal_t, size=(SIZE, SIZE), mode="bilinear", align_corners=False)
            .squeeze().numpy()
        )

        if original_pil is None:
            return None
        orig = np.array(original_pil.convert("RGB").resize((SIZE, SIZE))).astype(np.float32) / 255.0
        r = np.clip(1.5 - np.abs(4.0 * sal - 3.0), 0, 1)
        g = np.clip(1.5 - np.abs(4.0 * sal - 2.0), 0, 1)
        b = np.clip(1.5 - np.abs(4.0 * sal - 1.0), 0, 1)
        blend = np.clip(0.55 * orig + 0.45 * np.stack([r, g, b], axis=-1), 0, 1)
        return Image.fromarray((blend * 255).astype(np.uint8))

    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def model_name(self) -> str:
        return "vit_b16"

    @property
    def model_version(self) -> str:
        if self._loaded and self._epoch is not None:
            return f"epoch-{self._epoch}"
        return "1.0.0" if self._loaded else "not-loaded"
