from __future__ import annotations

"""Model registry — fixed weight paths and ENABLED_MODELS."""

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
from app.ml.yolo_predictor import YOLOPredictor
from app.ml.moe_predictor import MoEPredictor

logger = get_logger(__name__)

_KNOWN_MODELS = {"mock", "resnet50", "efficientnet_b4", "vit_b16", "yolo_damage", "moe"}


class ModelRegistry:
    def __init__(self) -> None:
        self._registry: dict[str, BasePredictor] = {}
        self._register_defaults()

    def _register_defaults(self) -> None:
        enabled = set(settings.enabled_models_list)

        for unknown in sorted(enabled - _KNOWN_MODELS):
            logger.warning("Unknown model in ENABLED_MODELS ignored: %s", unknown)

        if not enabled:
            enabled = {"mock"}

        if "mock" in enabled:
            self.register("mock", MockPredictor())
        if "resnet50" in enabled:
            self.register("resnet50", ResNetPredictor())
        if "efficientnet_b4" in enabled:
            self.register("efficientnet_b4", EfficientNetPredictor())
        if "vit_b16" in enabled:
            self.register("vit_b16", ViTPredictor())
        if "yolo_damage" in enabled:
            self.register("yolo_damage", YOLOPredictor())
        if "moe" in enabled:
            self.register("moe", MoEPredictor())

        if not self._registry:
            logger.warning("No valid models registered — falling back to mock.")
            self.register("mock", MockPredictor())

    def register(self, name: str, predictor: BasePredictor) -> None:
        self._registry[name] = predictor
        logger.debug("Registered predictor: %s", name)

    def get(self, name: str) -> BasePredictor:
        if name not in self._registry:
            raise ModelNotFoundError(
                message=f"Model '{name}' not found. "
                f"Available: {list(self._registry.keys())}"
            )
        return self._registry[name]

    def list_models(self) -> list[dict[str, Any]]:
        return [
            {"name": name, "loaded": p.is_loaded(), "version": p.model_version}
            for name, p in self._registry.items()
        ]

    def load_all(self) -> None:
        weights_dir: Path = settings.MODEL_WEIGHTS_DIR

        # ── Weight file map ───────────────────────────────────────────────────
        # All checkpoint files follow the training notebook naming convention.
        # MoE receives the weights directory, not a single file.
        weight_map: dict[str, Path | None] = {
            "mock": None,
            "resnet50": weights_dir / "resnet50_best.pth",
            "efficientnet_b4": weights_dir / "efficientnet_b4_best.pth",
            "vit_b16": weights_dir / "vit_b16_best.pth",
            "yolo_damage": weights_dir / "yolo_damage_best.pth",
            "moe": weights_dir,  # directory, not single file
        }

        for name, predictor in self._registry.items():
            path = weight_map.get(name)
            try:
                predictor.load_model(path)
                if predictor.is_loaded():
                    logger.info(
                        "Loaded: %-20s version=%s", name, predictor.model_version
                    )
                else:
                    logger.warning(
                        "Not loaded: %s (weights missing or load failed)", name
                    )
            except Exception as e:
                logger.error("load_all: '%s' raised %s", name, e, exc_info=True)
            finally:
                import gc
                gc.collect()

    def is_healthy(self) -> bool:
        return any(p.is_loaded() for p in self._registry.values())


model_registry = ModelRegistry()
