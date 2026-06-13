from __future__ import annotations

"""EfficientNet predictor skeleton."""

from pathlib import Path
from typing import Any

from app.ml.base_predictor import BasePredictor
from app.core.logging import get_logger
from app.utils.constants import NUM_CLASSES
from app.ml.base_predictor import PredictionResult
from app.utils.constants import CLASS_NAMES

logger = get_logger(__name__)


class EfficientNetPredictor(BasePredictor):
    """EfficientNetB4 predictor skeleton."""

    def __init__(self) -> None:
        self._model = None
        self._loaded = False
        self._device = "cpu"

    def load_model(self, weights_path: Path | None = None) -> None:
        try:
            import torch
            import torchvision.models as models

            self._device = "cuda" if torch.cuda.is_available() else "cpu"
            if weights_path is None or not weights_path.exists():
                logger.warning(
                    "EfficientNet weights not found at %s. Predictor inactive.",
                    weights_path,
                )
                return
            model = models.efficientnet_b4(weights=None)
            in_features = model.classifier[1].in_features
            model.classifier = torch.nn.Sequential(
                torch.nn.Dropout(0.4),
                torch.nn.Linear(in_features, NUM_CLASSES),
            )
            model.load_state_dict(torch.load(weights_path, map_location=self._device))
            model.eval()
            self._model = model.to(self._device)
            self._loaded = True
            logger.info(
                "EfficientNetB4 loaded from %s on %s", weights_path, self._device
            )
        except ImportError:
            logger.error("PyTorch not installed. EfficientNetPredictor unavailable.")
        except Exception as e:
            logger.error("Failed to load EfficientNetB4: %s", str(e))

    # Replace predict():
    def predict(self, image: Any) -> PredictionResult:
        if not self._loaded:
            raise RuntimeError("EfficientNet weights not loaded.")
        import torch, numpy as np

        if hasattr(image, "convert"):
            pil = image.convert("RGB").resize((224, 224))
            arr = np.array(pil).astype(np.float32) / 255.0
            arr = (arr - np.array([0.485, 0.456, 0.406])) / np.array(
                [0.229, 0.224, 0.225]
            )
            tensor = torch.from_numpy(arr.transpose(2, 0, 1)).unsqueeze(0).float()
        else:
            tensor = image

        tensor = tensor.to(self._device)
        with torch.no_grad():
            logits = self._model(tensor)
        probs = torch.softmax(logits[0], dim=0).cpu().numpy()
        pred_idx = int(probs.argmax())
        return PredictionResult(
            predicted_class=CLASS_NAMES[pred_idx],
            confidence=float(probs[pred_idx]),
            class_probabilities={CLASS_NAMES[i]: float(p) for i, p in enumerate(probs)},
            gradcam_image=None,
        )

    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def model_name(self) -> str:
        return "efficientnet_b4"

    @property
    def model_version(self) -> str:
        return "1.0.0"
