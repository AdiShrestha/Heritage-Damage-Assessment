from __future__ import annotations

"""ResNet50 predictor with EMA inference and Grad-CAM support."""

from pathlib import Path
from typing import Any

from app.core.exceptions import InferenceError
from app.core.logging import get_logger
from app.ml.base_predictor import BasePredictor, PredictionResult
from app.utils.constants import CLASS_NAMES, NUM_CLASSES


class ResNetPredictor(BasePredictor):
    """ResNet50 predictor backed by trained weights."""

    def __init__(self) -> None:
        self._model = None
        self._ema = None
        self._loaded = False
        self._device = "cpu"
        self._epoch: int | None = None
        self._best_f1: float | None = None
        self._logger = get_logger(__name__)

    def load_model(self, weights_path: Path | None = None) -> None:
        """Load trained ResNet50 weights and EMA state."""
        try:
            import torch
            import torch.nn as nn
            import torchvision.models as models
            from torch_ema import ExponentialMovingAverage

            self._device = "cuda" if torch.cuda.is_available() else "cpu"

            if weights_path is None or not weights_path.exists():
                self._logger.warning("ResNet50 weights not found at %s. Predictor inactive.", weights_path)
                self._loaded = False
                self._model = None
                self._ema = None
                self._epoch = None
                self._best_f1 = None
                return

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

            ckpt = torch.load(weights_path, map_location=self._device)
            model.load_state_dict(ckpt["model_state"])

            ema = ExponentialMovingAverage(model.parameters(), decay=0.9998)
            ema.load_state_dict(ckpt["ema_state"])

            self._epoch = int(ckpt.get("epoch", -1)) + 1
            self._best_f1 = ckpt.get("best_f1")

            model.eval()
            model = model.to(self._device)

            self._model = model
            self._ema = ema
            self._loaded = True
            self._logger.info(
                "ResNet50 loaded from %s on %s (epoch %s, best_f1=%s)",
                weights_path,
                self._device,
                self._epoch,
                self._best_f1,
            )
        except ImportError:
            self._logger.error("PyTorch not installed.")
            self._loaded = False
            self._model = None
            self._ema = None
            self._epoch = None
            self._best_f1 = None
        except Exception as exc:
            self._logger.error("Failed to load ResNet50: %s", str(exc))
            self._loaded = False
            self._model = None
            self._ema = None
            self._epoch = None
            self._best_f1 = None

    def predict(self, image: Any) -> PredictionResult:
        """Run inference using the EMA-averaged ResNet50 weights."""
        if not self._loaded or self._model is None or self._ema is None:
            raise InferenceError("ResNet50 weights not loaded.")

        import numpy as np
        import torch
        from PIL import Image

        if not hasattr(image, "convert"):
            raise InferenceError("Invalid image supplied for inference.")

        pil_image: Image.Image = image.convert("RGB") if image.mode != "RGB" else image.copy()
        resized = pil_image.resize((224, 224), Image.Resampling.LANCZOS)
        image_array = np.array(resized).astype(np.float32) / 255.0
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        normalized = (image_array - mean) / std
        input_tensor = torch.from_numpy(normalized.transpose(2, 0, 1)).unsqueeze(0).float().to(self._device)

        self._model.eval()
        with self._ema.average_parameters():
            with torch.no_grad():
                logits = self._model(input_tensor)

        probs = torch.softmax(logits[0], dim=0).cpu().numpy()
        pred_idx = int(np.argmax(probs))

        gradcam_image = None
        try:
            gradcam_image = self._generate_gradcam(input_tensor, pil_image)
        except Exception as exc:
            self._logger.warning("Grad-CAM generation failed: %s", str(exc))

        class_probabilities = {
            class_name: round(float(probs[idx]), 4)
            for idx, class_name in enumerate(CLASS_NAMES)
        }

        return PredictionResult(
            predicted_class=CLASS_NAMES[pred_idx],
            confidence=float(probs[pred_idx]),
            class_probabilities=class_probabilities,
            gradcam_image=gradcam_image,
        )

    def _generate_gradcam(self, input_tensor: Any, original_pil_image: Any):
        """Generate a Grad-CAM overlay for the current prediction."""
        try:
            import numpy as np
            from PIL import Image
            from pytorch_grad_cam import GradCAM
            from pytorch_grad_cam.utils.image import show_cam_on_image

            self._model.eval()
            with self._ema.average_parameters():
                cam = GradCAM(model=self._model, target_layers=[self._model.layer4[-1]])
                grayscale_cam = cam(input_tensor=input_tensor)[0]

            rgb_image = original_pil_image.convert("RGB").resize((224, 224), Image.Resampling.LANCZOS)
            rgb_float = np.asarray(rgb_image).astype(np.float32) / 255.0
            rgb_float = np.clip(rgb_float, 0.0, 1.0)
            overlay = show_cam_on_image(rgb_float, grayscale_cam, use_rgb=True)
            return Image.fromarray(overlay)
        except Exception as exc:
            self._logger.warning("Grad-CAM generation failed: %s", str(exc))
            return None

    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def model_name(self) -> str:
        return "resnet50"

    @property
    def model_version(self) -> str:
        if self._loaded and self._epoch is not None:
            return f"epoch-{self._epoch}"
        return "not-loaded"
