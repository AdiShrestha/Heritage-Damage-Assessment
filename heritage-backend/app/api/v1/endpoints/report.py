# TARGET: app/api/v1/endpoints/report.py
from __future__ import annotations

"""
POST /api/v1/report          — predict + generate full assessment report
GET  /api/v1/report/history  — query prediction history
GET  /api/v1/report/flagged  — predictions flagged for human review
GET  /api/v1/report/trend/{site_id} — severity trend for one site
"""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, File, Query, Request, UploadFile, HTTPException

from app.core.config import settings
from app.core.logging import get_logger
from app.ml.model_registry import model_registry
from app.schemas.report import AssessmentReport
from app.services.history_service import get_history_service, HistoryService
from app.services.image_service import ImageService
from app.services.prediction_service import PredictionService
from app.services.report_service import generate_report

logger = get_logger(__name__)

router = APIRouter(prefix="/report", tags=["Assessment Report"])


def _pred_service() -> PredictionService:
    return PredictionService(model_registry)


# ─── POST /report ─────────────────────────────────────────────────────────────


@router.post(
    "",
    response_model=AssessmentReport,
    summary="Predict and generate structured assessment report",
)
async def predict_and_report(
    request: Request,
    file: UploadFile = File(...),
    model: str = Query(default="moe"),
    site_id: str | None = Query(default=None),
    site_name: str | None = Query(default=None),
    surveyor: str | None = Query(default=None),
    notes: str | None = Query(default=None),
    service: PredictionService = Depends(_pred_service),
    history: HistoryService = Depends(get_history_service),
) -> AssessmentReport:
    """
    One-shot endpoint: upload an image and receive a complete damage assessment
    report without needing to call `/predict` first.

    The report includes:
    - **assessment** — class, criticality, severity score and label
    - **quality** — model confidence, disagreement score, human-review flag
    - **experts** — per-expert prediction breakdown with gate weights
    - **trend** — severity over time if `site_id` matches history records
    - **recommendations** — action items based on criticality grade
    - **visualization** — note that the Grad-CAM composite is available via `/predict`

    Pass `site_id` to link this report to the prediction history and get
    trend data from previous surveys.
    """
    await ImageService.validate_upload(file)
    image = await ImageService.read_as_pil(file)
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))

    response = await service.run_prediction(image, model, request_id)

    # Fetch site history for trend block
    history_rows: list[dict] = []
    if site_id:
        try:
            history_rows = await history.get_site_history(site_id, limit=20)
        except Exception:
            pass

    # Record this prediction
    try:
        await history.record(response, site_id=site_id)
    except Exception as e:
        logger.warning("History record failed: %s", e)

    report = generate_report(
        response=response,
        site_id=site_id,
        site_name=site_name,
        surveyor=surveyor,
        notes=notes,
        history_rows=history_rows,
    )
    return AssessmentReport(**report)


# ─── GET /report/history ──────────────────────────────────────────────────────


@router.get("/history", summary="Query prediction history for a site")
async def site_history(
    site_id: str = Query(..., description="Site identifier"),
    limit: int = Query(default=50, ge=1, le=500),
    since: str | None = Query(default=None, description="ISO timestamp lower bound"),
    history: HistoryService = Depends(get_history_service),
) -> dict[str, Any]:
    rows = await history.get_site_history(site_id, limit=limit, since=since)
    return {"site_id": site_id, "count": len(rows), "predictions": rows}


# ─── GET /report/trend/{site_id} ──────────────────────────────────────────────


@router.get("/trend/{site_id}", summary="Severity trend over time for a site")
async def severity_trend(
    site_id: str,
    limit: int = Query(default=20, ge=2, le=200),
    history: HistoryService = Depends(get_history_service),
) -> dict[str, Any]:
    """
    Returns severity score over time — ready to pass to a line chart.
    Sorted newest-first. Requires at least two records to be meaningful.
    """
    trend = await history.get_severity_trend(site_id, limit=limit)
    dist = await history.criticality_distribution(site_id=site_id)
    return {
        "site_id": site_id,
        "data_points": len(trend),
        "criticality_distribution": dist,
        "trend": trend,
    }


# ─── GET /report/flagged ──────────────────────────────────────────────────────


@router.get("/flagged", summary="Predictions flagged for human review")
async def flagged_predictions(
    limit: int = Query(default=100, ge=1, le=500),
    history: HistoryService = Depends(get_history_service),
) -> dict[str, Any]:
    """
    Returns predictions where expert disagreement or low confidence triggered
    the `requires_human_review` flag.

    Use this as a work queue for manual conservation survey assignments.
    """
    rows = await history.get_flagged(limit=limit)
    return {"count": len(rows), "flagged": rows}


# ─── GET /report/stats ────────────────────────────────────────────────────────


@router.get("/stats", summary="Aggregate prediction statistics")
async def prediction_stats(
    history: HistoryService = Depends(get_history_service),
) -> dict[str, Any]:
    return await history.stats()
