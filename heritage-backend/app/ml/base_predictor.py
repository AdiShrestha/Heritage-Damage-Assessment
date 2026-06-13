from __future__ import annotations

"""Base predictor abstractions — PredictionResult carries MoE extras."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any
from pathlib import Path


@dataclass
class PredictionResult:
    """
    Result container returned by every predictor.

    Core fields are always populated.
    MoE-specific fields (criticality, gate_weights, per_expert,
    used_gate, expert_names) are set by MoEPredictor only;
    PredictionService reads them with getattr() so other predictors
    don't need to touch them.
    """

    # ── Core (required for all predictors) ───────────────────────────────────
    predicted_class: str
    confidence: float
    class_probabilities: dict[str, float]

    # gradcam_image: for MoE this is the full annotated composite PIL image.
    # For ResNet/EfficientNet/ViT it is a plain Grad-CAM overlay.
    # None if the predictor does not support it (mock, skeleton).
    gradcam_image: Any | None

    detections: list[dict[str, Any]] | None = None

    # ── MoE-specific (populated by MoEPredictor, None elsewhere) ─────────────
    criticality: str | None = None
    gate_weights: list[float] | None = None
    per_expert: list[dict] | None = None
    used_gate: bool | None = None
    expert_names: list[str] | None = None


class BasePredictor(ABC):
    """Abstract base class for all predictors."""

    @abstractmethod
    def load_model(self, weights_path: Path | None = None) -> None:
        """Load model weights into memory."""

    @abstractmethod
    def predict(self, image: Any) -> PredictionResult:
        """
        Run inference.
        image: PIL.Image (raw) OR torch.Tensor [1,3,224,224] (preprocessed).
        Implementations must handle both via:
            if hasattr(image, "convert"):  # PIL
            else:                          # tensor
        """

    @abstractmethod
    def is_loaded(self) -> bool:
        """Return True if model weights are loaded and ready."""

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Short identifier, e.g. 'resnet50', 'moe'."""

    @property
    @abstractmethod
    def model_version(self) -> str:
        """Version string, e.g. 'epoch-32' or '1.0.0'."""
