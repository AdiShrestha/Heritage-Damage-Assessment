from __future__ import annotations

"""Model registry holding all available predictors."""

from pathlib import Path
from typing import Any

from app.core.config import settings
from app.core.logging import get_logger
from app.core.exceptions import ModelNotFoundError
from app.ml.base_predictor import BasePredictor
from app.ml.mock_predictor import MockPredictor
from app.ml.resnet_predictor import ResNetPredictor
from app.ml.efficientnet_predictor import EfficientNetPredictor
from app.ml.vit_predictor import ViTPredictor

logger = get_logger(__name__)


class ModelRegistry:
    """Singleton-style registry. Holds all predictor instances."""

    def __init__(self) -> None:
        self._registry: dict[str, BasePredictor] = {}
        self._register_defaults()

    def _register_defaults(self) -> None:
        self.register("mock", MockPredictor())
        self.register("resnet50", ResNetPredictor())
        self.register("efficientnet_b4", EfficientNetPredictor())
        self.register("vit_b16", ViTPredictor())

    def register(self, name: str, predictor: BasePredictor) -> None:
        self._registry[name] = predictor

    def get(self, name: str) -> BasePredictor:
        if name not in self._registry:
            raise ModelNotFoundError(
                message=f"Model '{name}' not found. Available: {list(self._registry.keys())}"
            )
        return self._registry[name]

    def list_models(self) -> list[dict[str, Any]]:
        return [
            {"name": name, "loaded": p.is_loaded(), "version": p.model_version}
            for name, p in self._registry.items()
        ]

    def load_all(self) -> None:
        weights_dir: Path = settings.MODEL_WEIGHTS_DIR
        weight_map = {
            "resnet50": weights_dir / "resnet50_best.pth",
            "efficientnet_b4": weights_dir / "efficientnet_b4_best.pth",
            "vit_b16": weights_dir / "vit_b16_best.pth",
        }
        for name, predictor in self._registry.items():
            path = weight_map.get(name)
            try:
                predictor.load_model(path)
            except Exception as e:
                logger.error("Failed to load model '%s': %s", name, str(e))

    def is_healthy(self) -> bool:
        return any(p.is_loaded() for p in self._registry.values())


model_registry = ModelRegistry()
