from __future__ import annotations

"""Vision Transformer predictor skeleton using timm if available."""

from pathlib import Path
from typing import Any

from app.ml.base_predictor import BasePredictor
from app.core.logging import get_logger
from app.utils.constants import NUM_CLASSES

logger = get_logger(__name__)


class ViTPredictor(BasePredictor):
    """ViT-B/16 predictor skeleton."""

    def __init__(self) -> None:
        self._model = None
        self._loaded = False
        self._device = "cpu"

    def load_model(self, weights_path: Path | None = None) -> None:
        try:
            import torch
            import timm

            self._device = "cuda" if torch.cuda.is_available() else "cpu"
            if weights_path is None or not weights_path.exists():
                logger.warning("ViT weights not found at %s. Predictor inactive.", weights_path)
                return
            model = timm.create_model("vit_base_patch16_384", pretrained=False, num_classes=NUM_CLASSES)
            model.load_state_dict(torch.load(weights_path, map_location=self._device))
            model.eval()
            self._model = model.to(self._device)
            self._loaded = True
            logger.info("ViT-B loaded from %s on %s", weights_path, self._device)
        except ImportError:
            logger.error("timm not installed. ViTPredictor unavailable.")
        except Exception as e:
            logger.error("Failed to load ViT: %s", str(e))

    def predict(self, image: Any):
        if not self._loaded:
            raise RuntimeError("ViT weights not loaded.")
        raise RuntimeError("ViT inference not yet implemented.")

    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def model_name(self) -> str:
        return "vit_b16"

    @property
    def model_version(self) -> str:
        return "1.0.0"
