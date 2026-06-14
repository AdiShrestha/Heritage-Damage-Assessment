from __future__ import annotations

"""YOLO fallback predictor (Custom CNN) — weights loaded from Hugging Face Hub, local fallback."""

from pathlib import Path
from typing import Any

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from PIL import Image

from app.ml.base_predictor import BasePredictor, PredictionResult
from app.core.logging import get_logger
from app.core.exceptions import InferenceError
from app.utils.constants import CLASS_NAMES, NUM_CLASSES

logger = get_logger(__name__)


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
            nn.Linear(256, NUM_CLASSES),
        )

    def forward(self, x):
        return self.head(self.backbone(x))


class YOLOPredictor(BasePredictor):
    """Fallback CNN predictor originally named YOLO."""

    def __init__(self) -> None:
        self._model = None
        self._loaded = False
        self._device = "cpu"
        self._weights_name: str = "not-loaded"

    _HF_REPO_ID = "monarch8661/moe"
    _HF_FILENAME = "yolo_damage_best.pth"

    def load_model(self, weights_path: Path | None = None) -> None:
        """Load trained model weights."""
        try:
            # ── Resolve weights: HF Hub (primary) → local fallback → skip ─────
            resolved_path = self._resolve_weights(weights_path)
            if resolved_path is None:
                logger.warning("YOLO weights unavailable — inactive.")
                self._loaded = False
                return

            self._device = "cuda" if torch.cuda.is_available() else "cpu"
            self._model = _YOLOFallback().to(self._device)
            
            ckpt = torch.load(resolved_path, map_location=self._device)
            state = ckpt.get("model_state", ckpt)
            self._model.load_state_dict(state, strict=False)
            self._model.eval()

            self._weights_name = Path(resolved_path).name
            self._loaded = True
            logger.info("YOLO (fallback CNN) classifier loaded from %s", resolved_path)
        except Exception as e:
            logger.error("Failed to load YOLO fallback: %s", str(e), exc_info=True)
            self._loaded = False

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
            logger.info("YOLO weights downloaded from HF Hub")
            return Path(local)
        except Exception as e:
            logger.debug("HF Hub download failed for YOLO: %s", e)

        # 2. Fallback: local weights path
        if weights_path is not None and weights_path.exists():
            logger.info("Using local YOLO weights at %s", weights_path)
            return weights_path

        # 3. Neither available
        return None

    def predict(self, image: Any) -> PredictionResult:
        if not self._loaded or self._model is None:
            raise InferenceError("YOLO weights not loaded.")

        if not hasattr(image, "convert"):
            raise InferenceError("Invalid image supplied for inference.")

        try:
            pil_image = image.convert("RGB")
            
            # Preprocess
            arr = np.array(pil_image.resize((224, 224))).astype(np.float32) / 255.0
            mean = np.array([0.485, 0.456, 0.406])
            std = np.array([0.229, 0.224, 0.225])
            arr = (arr - mean) / std
            tensor = torch.from_numpy(arr.transpose(2, 0, 1)).unsqueeze(0).float().to(self._device)

            with torch.no_grad():
                logits = self._model(tensor)
                probs = F.softmax(logits, dim=1)[0]
            
            pred_idx = int(probs.argmax())
            confidence = float(probs[pred_idx])
            predicted_class = CLASS_NAMES[pred_idx]
            
            class_probs = {
                CLASS_NAMES[i]: round(float(probs[i]), 4)
                for i in range(NUM_CLASSES)
            }

            # ── Grad-CAM ─────────────────────────────────────────────────────
            gradcam_image = None
            try:
                gradcam_image = self._gradcam(tensor, pred_idx, pil_image)
            except Exception as e:
                logger.debug("YOLO Grad-CAM skipped: %s", e)

            return PredictionResult(
                predicted_class=predicted_class,
                confidence=confidence,
                class_probabilities=class_probs,
                gradcam_image=gradcam_image,
                detections=None,
            )
        except InferenceError:
            raise
        except Exception as e:
            logger.error("YOLO inference failed: %s", str(e))
            raise InferenceError(f"Classification failed: {str(e)}")

    def _gradcam(self, tensor: torch.Tensor, pred_idx: int, original_pil: Image.Image) -> Image.Image:
        """Grad-CAM for the fallback CNN."""
        SIZE = 224
        
        # Target the last Conv2d in the backbone
        conv_layers = [m for m in self._model.backbone.modules() if isinstance(m, nn.Conv2d)]
        if not conv_layers:
            raise RuntimeError("No Conv2d layers found in backbone")
        target = conv_layers[-1]

        activations: list = []
        gradients: list = []

        def fwd(_, __, out):
            activations.append(out.detach().clone())

        def bwd(_, __, grad_out):
            gradients.append(grad_out[0].detach().clone())

        h_fwd = target.register_forward_hook(fwd)
        h_bwd = target.register_full_backward_hook(bwd)

        try:
            inp = tensor.detach().clone().requires_grad_(True)
            self._model.eval()
            with torch.enable_grad():
                logits = self._model(inp)
                score = logits[0, pred_idx]
                self._model.zero_grad()
                score.backward()
        finally:
            h_fwd.remove()
            h_bwd.remove()

        if not activations or not gradients:
            raise RuntimeError("Hooks did not fire")

        act = activations[0].squeeze(0)   # [C, H, W]
        grad = gradients[0].squeeze(0)    # [C, H, W]

        weights = grad.mean(dim=[1, 2], keepdim=True)
        cam = F.relu((weights * act).sum(dim=0))
        cam = F.interpolate(
            cam.unsqueeze(0).unsqueeze(0).float(),
            size=(SIZE, SIZE),
            mode="bilinear",
            align_corners=False,
        ).squeeze().cpu().numpy()
        
        cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-7)

        # ── JET colormap overlay ──────────────────────────────────────────────
        orig = np.array(original_pil.resize((SIZE, SIZE))).astype(np.float32) / 255.0
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
        return "yolo_damage"

    @property
    def model_version(self) -> str:
        return self._weights_name if self._loaded else "not-loaded"
