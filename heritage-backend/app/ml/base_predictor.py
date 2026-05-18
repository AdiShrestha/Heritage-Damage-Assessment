from __future__ import annotations

"""Base predictor abstractions."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any
from pathlib import Path


@dataclass
class PredictionResult:
    """Result container for predictions."""

    predicted_class: str
    confidence: float
    class_probabilities: dict[str, float]
    gradcam_image: Any | None
    detections: list[dict[str, Any]] | None = None


class BasePredictor(ABC):
    """Abstract base class for predictors."""

    @abstractmethod
    def load_model(self, weights_path: Path | None = None) -> None:
        """Load model weights into memory."""

    @abstractmethod
    def predict(self, image: Any) -> PredictionResult:
        """Run inference on a PIL Image."""

    @abstractmethod
    def is_loaded(self) -> bool:
        """Return True if model weights are loaded."""

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Short identifier for the model."""

    @property
    @abstractmethod
    def model_version(self) -> str:
        """Model version string."""
