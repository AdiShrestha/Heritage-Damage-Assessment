from __future__ import annotations

"""EfficientNet predictor skeleton."""

from pathlib import Path
from typing import Any

from app.ml.base_predictor import BasePredictor
from app.core.logging import get_logger
from app.utils.constants import NUM_CLASSES

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
                logger.warning("EfficientNet weights not found at %s. Predictor inactive.", weights_path)
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
            logger.info("EfficientNetB4 loaded from %s on %s", weights_path, self._device)
        except ImportError:
            logger.error("PyTorch not installed. EfficientNetPredictor unavailable.")
        except Exception as e:
            logger.error("Failed to load EfficientNetB4: %s", str(e))

    def predict(self, image: Any):
        if not self._loaded:
            raise RuntimeError("EfficientNet weights not loaded.")
        raise RuntimeError("EfficientNet inference not yet implemented.")

    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def model_name(self) -> str:
        return "efficientnet_b4"

    @property
    def model_version(self) -> str:
        return "1.0.0"
