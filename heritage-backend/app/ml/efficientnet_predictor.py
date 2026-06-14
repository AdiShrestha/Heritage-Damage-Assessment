from __future__ import annotations

"""EfficientNet-B4 predictor — weights loaded from Hugging Face Hub, local fallback."""

from pathlib import Path
from typing import Any

from app.ml.base_predictor import BasePredictor, PredictionResult
from app.core.exceptions import InferenceError
from app.core.logging import get_logger
from app.utils.constants import CLASS_NAMES, NUM_CLASSES

logger = get_logger(__name__)


class EfficientNetPredictor(BasePredictor):
    def __init__(self) -> None:
        self._model = None
        self._loaded = False
        self._device = "cpu"
        self._epoch: int | None = None

    _HF_REPO_ID = "monarch8661/moe"
    _HF_FILENAME = "efficientnet_b4_best.pth"

    def load_model(self, weights_path: Path | None = None) -> None:
        try:
            import torch
            import torch.nn as nn
            import torchvision.models as models

            self._device = "cuda" if torch.cuda.is_available() else "cpu"

            # ── Resolve weights: HF Hub (primary) → local fallback → skip ─────
            resolved_path = self._resolve_weights(weights_path)
            if resolved_path is None:
                logger.warning("EfficientNet weights unavailable — inactive.")
                return

            model = models.efficientnet_b4(weights=None)
            in_feats = model.classifier[1].in_features
            model.classifier = nn.Sequential(
                nn.Dropout(0.4),
                nn.Linear(in_feats, 512),
                nn.ReLU(inplace=True),
                nn.Dropout(0.3),
                nn.Linear(512, NUM_CLASSES),
            )

            # ── Extract model_state from checkpoint wrapper ───────────────────
            # Checkpoint format: {"model_state": …, "ema_state": …, "epoch": …}
            # DO NOT pass the whole dict to load_state_dict.
            ckpt = torch.load(resolved_path, map_location=self._device)
            state = ckpt.get("model_state", ckpt)  # fall back if plain state dict
            model.load_state_dict(state, strict=True)
            self._epoch = int(ckpt.get("epoch", -1)) + 1
            model.eval()

            self._model = model.to(self._device)
            self._loaded = True
            logger.info(
                "EfficientNet-B4 loaded from %s on %s", resolved_path, self._device
            )

        except Exception as exc:
            logger.error("EfficientNet load FAILED: %s", exc, exc_info=True)
            self._loaded = False
            self._model = None

    def _resolve_weights(self, weights_path: Path | None) -> Path | None:
        """Try HF Hub download first, then local path, then give up."""
        # 1. Primary: Hugging Face Hub
        try:
            from huggingface_hub import hf_hub_download

            local = hf_hub_download(
                repo_id=self._HF_REPO_ID,
                filename=self._HF_FILENAME,
                cache_dir="/tmp/hf_cache",
            )
            logger.info("EfficientNet weights downloaded from HF Hub")
            return Path(local)
        except Exception as e:
            logger.debug("HF Hub download failed for EfficientNet: %s", e)

        # 2. Fallback: local weights path
        if weights_path is not None and weights_path.exists():
            logger.info("Using local EfficientNet weights at %s", weights_path)
            return weights_path

        # 3. Neither available
        return None

    def predict(self, image: Any) -> PredictionResult:
        if not self._loaded or self._model is None:
            raise InferenceError("EfficientNet weights not loaded.")

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
            logits = self._model(tensor)

        probs = torch.softmax(logits[0], dim=0).cpu().numpy()
        pred_idx = int(probs.argmax())

        gradcam_image = None
        try:
            gradcam_image = self._gradcam(
                tensor, image if hasattr(image, "convert") else None
            )
        except Exception as e:
            logger.debug("EfficientNet Grad-CAM skipped: %s", e)

        return PredictionResult(
            predicted_class=CLASS_NAMES[pred_idx],
            confidence=float(probs[pred_idx]),
            class_probabilities={CLASS_NAMES[i]: float(p) for i, p in enumerate(probs)},
            gradcam_image=gradcam_image,
        )

    def _gradcam(self, tensor, original_pil):
        import torch
        import torch.nn.functional as F
        import numpy as np
        from PIL import Image

        # EfficientNet: features[-1] is a Sequential wrapper.
        # Walk into it to find the last Conv2d for spatial activations.
        import torch.nn as nn
        target = self._model.features[-1]
        # Drill down to the actual conv submodule so hooks capture 4-D tensors
        conv_layers = [m for m in target.modules() if isinstance(m, nn.Conv2d)]
        if conv_layers:
            target = conv_layers[-1]
        activations = []
        gradients = []

        h_fwd = target.register_forward_hook(
            lambda _, __, out: activations.append(out.detach().clone())
        )
        h_bwd = target.register_full_backward_hook(
            lambda _, __, g: gradients.append(g[0].detach().clone())
        )

        try:
            inp = tensor.detach().clone().requires_grad_(True)
            with torch.enable_grad():
                out = self._model(inp)
                score = out[0, out[0].argmax()]
                self._model.zero_grad()
                score.backward()
        finally:
            h_fwd.remove()
            h_bwd.remove()

        if not activations or not gradients:
            return None

        act = activations[0].squeeze(0)
        grad = gradients[0].squeeze(0)
        cam = F.relu((grad.mean(dim=[1, 2], keepdim=True) * act).sum(dim=0))
        cam = (
            F.interpolate(
                cam.unsqueeze(0).unsqueeze(0).float(),
                size=(224, 224),
                mode="bilinear",
                align_corners=False,
            )
            .squeeze()
            .cpu()
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
        jet = np.stack([r, g, b], axis=-1)
        blend = np.clip(0.55 * orig + 0.45 * jet, 0, 1)
        return Image.fromarray((blend * 255).astype(np.uint8))

    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def model_name(self) -> str:
        return "efficientnet_b4"

    @property
    def model_version(self) -> str:
        if self._loaded and self._epoch is not None:
            return f"epoch-{self._epoch}"
        return "1.0.0" if self._loaded else "not-loaded"
