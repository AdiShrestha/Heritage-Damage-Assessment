# TARGET: app/schemas/batch.py
from __future__ import annotations

"""Schemas for batch prediction requests and responses."""

from datetime import datetime
from typing import Annotated, Optional, List

from pydantic import BaseModel, Field, ConfigDict


class BatchItemResult(BaseModel):
    """Result for one image in a batch."""

    filename: str
    predicted_class: str
    confidence: Annotated[float, Field(ge=0.0, le=1.0)]
    severity_score: Annotated[float, Field(ge=0.0, le=1.0)]
    severity_label: str
    criticality: str
    class_probabilities: dict[str, float]
    gradcam_image_base64: str | None = None
    gate_weights: list[float] | None = None
    inference_time_ms: float = 0.0
    from_cache: bool = False
    error: str | None = None


class BatchSummary(BaseModel):
    """Aggregate stats across a batch — ready for dashboard display."""

    successful: int
    failed: int
    cache_hits: int
    avg_severity_score: float
    avg_confidence: float
    class_distribution: dict[str, int]
    criticality_distribution: dict[str, int]
    highest_priority_file: str | None
    highest_priority_severity: float | None
    total_inference_ms: float


class BatchPredictionResponse(BaseModel):
    """Full batch response — results sorted highest severity first."""

    batch_id: str
    model_used: str
    total_images: int
    results: List[BatchItemResult]
    summary: BatchSummary
    total_inference_ms: float
    timestamp: datetime

    model_config = ConfigDict(json_encoders={datetime: lambda v: v.isoformat()})
