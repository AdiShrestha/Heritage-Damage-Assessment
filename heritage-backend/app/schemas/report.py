# TARGET: app/schemas/report.py
from __future__ import annotations

"""Schema for the structured assessment report."""

from typing import Any, Optional
from pydantic import BaseModel


class AssessmentReport(BaseModel):
    """
    Full assessment report returned by POST /api/v1/report or
    GET /api/v1/report/{request_id}.
    """

    report_id: str
    generated_at: str
    request_id: str
    site: dict[str, Any]
    assessment: dict[str, Any]
    quality: dict[str, Any]
    experts: list[dict[str, Any]]
    trend: Optional[dict[str, Any]]
    recommendations: list[str]
    visualization: dict[str, Any]

    model_config = {"from_attributes": True}
