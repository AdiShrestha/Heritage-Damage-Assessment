from __future__ import annotations

"""ResNet50 predictor — weights loaded from Hugging Face Hub, local fallback."""

from pathlib import Path
from typing import Any

from app.core.exceptions import InferenceError
from app.core.logging import get_logger
from app.ml.base_predictor import BasePredictor, PredictionResult
from app.utils.constants import CLASS_NAMES, NUM_CLASSES

logger = get_logger(__name__)


class ResNetPredictor(BasePredictor):
    def __init__(self) -> None:
        self._model = None
        self._ema = None  # None if torch_ema absent
        self._loaded = False
        self._device = "cpu"
        self._epoch: int | None = None
        self._best_f1: float | None = None

    _HF_REPO_ID = "monarch8661/moe"
    _HF_FILENAME = "resnet50_best.pth"

    def load_model(self, weights_path: Path | None = None) -> None:
        try:
            import torch
            import torch.nn as nn
            import torchvision.models as models

            self._device = "cuda" if torch.cuda.is_available() else "cpu"

            # ── Resolve weights: HF Hub (primary) → local fallback → skip ─────
            resolved_path = self._resolve_weights(weights_path)
            if resolved_path is None:
                logger.warning("ResNet50 weights unavailable — inactive.")
                return

            # ── Build model ───────────────────────────────────────────────────
            model = models.resnet50(weights=None)
            model.fc = nn.Sequential(
                nn.BatchNorm1d(2048),
                nn.Dropout(p=0.4),
                nn.Linear(2048, 512),
                nn.ReLU(inplace=True),
                nn.BatchNorm1d(512),
                nn.Dropout(p=0.3),
                nn.Linear(512, NUM_CLASSES),
            )

            # ── Load checkpoint ───────────────────────────────────────────────
            # Checkpoint is {"model_state": …, "ema_state": …, "epoch": …, …}
            ckpt = torch.load(resolved_path, map_location=self._device)
            state = ckpt.get("model_state", ckpt)  # fall back if plain state dict
            model.load_state_dict(state, strict=True)
            self._epoch = int(ckpt.get("epoch", -1)) + 1
            self._best_f1 = ckpt.get("best_f1")

            model.eval()
            self._model = model.to(self._device)

            # ── EMA (optional) ────────────────────────────────────────────────
            try:
                from torch_ema import ExponentialMovingAverage

                ema = ExponentialMovingAverage(model.parameters(), decay=0.9998)
                if "ema_state" in ckpt:
                    ema.load_state_dict(ckpt["ema_state"])
                self._ema = ema
                logger.info(
                    "ResNet50 loaded WITH EMA from %s (epoch %s, F1=%.4f)",
                    resolved_path,
                    self._epoch,
                    self._best_f1 or 0,
                )
            except ImportError:
                self._ema = None
                logger.warning(
                    "torch_ema not installed — ResNet50 loaded WITHOUT EMA. "
                    "Install with: pip install torch-ema"
                )
                logger.info(
                    "ResNet50 loaded (no EMA) from %s (epoch %s, F1=%.4f)",
                    resolved_path,
                    self._epoch,
                    self._best_f1 or 0,
                )

            self._loaded = True

        except Exception as exc:
            # Log the real error — don't swallow it silently
            logger.error("ResNet50 load FAILED: %s", exc, exc_info=True)
            self._loaded = False
            self._model = None
            self._ema = None

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
            logger.info("ResNet50 weights downloaded from HF Hub")
            return Path(local)
        except Exception as e:
            logger.debug("HF Hub download failed for ResNet50: %s", e)

        # 2. Fallback: local weights path
        if weights_path is not None and weights_path.exists():
            logger.info("Using local ResNet50 weights at %s", weights_path)
            return weights_path

        # 3. Neither available
        return None

    def predict(self, image: Any) -> PredictionResult:
        if not self._loaded or self._model is None:
            raise InferenceError("ResNet50 weights not loaded.")

        import numpy as np
        import torch
        from PIL import Image

        # Accept both PIL image and pre-processed tensor
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

        def _infer():
            with torch.no_grad():
                return self._model(tensor)

        if self._ema is not None:
            with self._ema.average_parameters():
                logits = _infer()
        else:
            logits = _infer()

        probs = torch.softmax(logits[0], dim=0).cpu().numpy()
        pred_idx = int(probs.argmax())

        gradcam_image = None
        try:
            gradcam_image = self._gradcam(
                tensor, image if hasattr(image, "convert") else None
            )
        except Exception as e:
            logger.debug("ResNet Grad-CAM skipped: %s", e)

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

        target = self._model.layer4[-1]
        activations = []
        gradients = []

        h_fwd = target.register_forward_hook(
            lambda _, __, out: activations.append(out.detach().clone())
        )
        h_bwd = target.register_full_backward_hook(
            lambda _, __, grad_out: gradients.append(grad_out[0].detach().clone())
        )

        try:
            inp = tensor.detach().clone().requires_grad_(True)
            if self._ema is not None:
                with self._ema.average_parameters():
                    with torch.enable_grad():
                        out = self._model(inp)
                        score = out[0, out[0].argmax()]
                        self._model.zero_grad()
                        score.backward()
            else:
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
        weights = grad.mean(dim=[1, 2], keepdim=True)
        cam = F.relu((weights * act).sum(dim=0))
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
        jet = _apply_jet(cam).astype(np.float32) / 255.0
        blend = np.clip(0.55 * orig + 0.45 * jet, 0, 1)
        return Image.fromarray((blend * 255).astype(np.uint8))

    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def model_name(self) -> str:
        return "resnet50"

    @property
    def model_version(self) -> str:
        return f"epoch-{self._epoch}" if self._loaded and self._epoch else "not-loaded"


def _apply_jet(t):
    import numpy as np

    r = np.clip(1.5 - np.abs(4.0 * t - 3.0), 0.0, 1.0)
    g = np.clip(1.5 - np.abs(4.0 * t - 2.0), 0.0, 1.0)
    b = np.clip(1.5 - np.abs(4.0 * t - 1.0), 0.0, 1.0)
    return (np.stack([r, g, b], axis=-1) * 255).astype(np.uint8)
