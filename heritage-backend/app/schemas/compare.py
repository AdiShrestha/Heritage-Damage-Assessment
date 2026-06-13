# TARGET: app/schemas/compare.py
from __future__ import annotations

"""Schemas for temporal comparison (two surveys of the same site)."""

from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class ComparisonResponse(BaseModel):
    """
    Result of comparing two survey images of the same heritage site.
    Powered by ViT CLS-token embedding cosine distance + severity delta.
    """

    site_id: str | None

    # ── Change detection ──────────────────────────────────────────────────────
    change_detected: bool
    change_label: str  # STABLE | DETERIORATING | IMPROVING | SIGNIFICANT_*
    cosine_distance: float  # 0 = identical embeddings, 1 = maximally different
    recommendation: str

    # ── Per-survey assessment ─────────────────────────────────────────────────
    predicted_class_t1: str
    predicted_class_t2: str
    severity_t1: float
    severity_t2: float
    severity_delta: float  # positive = getting worse
    severity_label_t1: str
    severity_label_t2: str
    class_probs_t1: dict[str, float]
    class_probs_t2: dict[str, float]

    # ── Technical ─────────────────────────────────────────────────────────────
    embedding_dim: int
    inference_time_ms: float
    timestamp: datetime

    model_config = ConfigDict(json_encoders={datetime: lambda v: v.isoformat()})
