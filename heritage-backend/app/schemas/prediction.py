# TARGET: app/schemas/prediction.py
from __future__ import annotations

"""
Prediction response schema — all fields including severity and disagreement.
Save this as app/schemas/prediction.py.
"""

from datetime import datetime
from typing import Annotated, List, Optional

from pydantic import BaseModel, Field, ConfigDict


class ClassProbability(BaseModel):
    class_name: str
    probability: Annotated[float, Field(ge=0.0, le=1.0)]


class ExpertPrediction(BaseModel):
    """One expert's vote inside the MoE ensemble."""

    expert: str
    predicted_class: str
    confidence: Annotated[float, Field(ge=0.0, le=1.0)]
    gate_weight: Annotated[float, Field(ge=0.0, le=1.0)] = 0.0


class Detection(BaseModel):
    bbox: list[float]
    confidence: Annotated[float, Field(ge=0.0, le=1.0)]
    damage_type: str
    class_id: int


class PredictionResponse(BaseModel):
    """
    Complete prediction response.

    ── Visualization ────────────────────────────────────────────────────────
    gradcam_image_base64 is a base64-encoded PNG composite (448×312 px):
      · Left  224×224  — original survey image
      · Right 224×224  — Grad-CAM / attention heatmap + red damage boxes
      · Top   52px     — colour-coded banner: class · confidence · criticality
      · Bottom 36px    — per-expert confidence bars

    Frontend usage:
        <img src={`data:image/png;base64,${response.gradcam_image_base64}`} />

    ── Severity ─────────────────────────────────────────────────────────────
    severity_score (0–1) is a continuous version of the discrete class:
        Undamaged → ~0.0   Partial Damage → ~0.5   Damaged → ~1.0
    Use this for ranking, progress bars, and trend charts.

    ── Disagreement ─────────────────────────────────────────────────────────
    disagreement_score (0–1): how much the four experts disagreed.
    requires_human_review: True if disagreement or entropy exceeded threshold.
    """

    # ── Core ─────────────────────────────────────────────────────────────────
    request_id: str
    model_used: str
    predicted_class: str
    confidence: Annotated[float, Field(ge=0.0, le=1.0)]
    class_probabilities: List[ClassProbability]
    inference_time_ms: float
    image_dimensions: dict[str, int]
    timestamp: datetime

    # ── Visualization ─────────────────────────────────────────────────────────
    gradcam_image_base64: str | None = Field(
        default=None,
        description="Base64 PNG — annotated composite sent directly to frontend.",
    )

    # ── Severity ──────────────────────────────────────────────────────────────
    severity_score: Optional[float] = Field(
        default=None,
        description="Continuous damage score 0.0–1.0. "
        "Better than the discrete class for ranking and trend charts.",
    )
    severity_label: Optional[str] = Field(
        default=None,
        description="MINIMAL | LOW | MODERATE | HIGH | CRITICAL",
    )

    # ── MoE extras (None when model != 'moe') ─────────────────────────────────
    criticality: Optional[str] = None
    gate_weights: Optional[List[float]] = None
    per_expert_predictions: Optional[List[ExpertPrediction]] = None
    used_gate: Optional[bool] = None

    # ── Expert disagreement ────────────────────────────────────────────────────
    disagreement_score: Optional[float] = Field(
        default=None,
        description="0 = all experts agreed. 1 = maximum disagreement.",
    )
    expert_votes: Optional[dict[str, int]] = Field(
        default=None,
        description="How many experts voted for each class.",
    )
    requires_human_review: Optional[bool] = Field(
        default=None,
        description="True if disagreement or entropy exceeded threshold. "
        "Flag this image for manual inspection.",
    )

    # ── YOLO detections ───────────────────────────────────────────────────────
    detections: Optional[List[Detection]] = None

    model_config = ConfigDict(json_encoders={datetime: lambda v: v.isoformat()})
