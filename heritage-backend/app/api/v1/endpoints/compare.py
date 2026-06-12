# TARGET: app/api/v1/endpoints/compare.py
from __future__ import annotations

"""
POST /api/v1/compare

Upload two survey images of the same heritage site (earlier and later).
Returns cosine distance between ViT embeddings, severity delta,
change label, and a restoration recommendation.
"""

import time
from datetime import datetime

from fastapi import APIRouter, File, Query, UploadFile, HTTPException
from fastapi import Depends

from app.core.logging import get_logger
from app.ml.model_registry import model_registry
from app.ml.temporal_comparator import TemporalComparator
from app.schemas.compare import ComparisonResponse
from app.services.image_service import ImageService

logger = get_logger(__name__)

router = APIRouter(prefix="/compare", tags=["Temporal Comparison"])


def _get_comparator() -> TemporalComparator:
    predictor = model_registry.get("moe")
    return TemporalComparator(predictor)


@router.post(
    "",
    response_model=ComparisonResponse,
    summary="Compare two surveys of the same site",
)
async def compare_surveys(
    image_t1: UploadFile = File(..., description="Earlier survey image"),
    image_t2: UploadFile = File(..., description="Later survey image"),
    site_id: str | None = Query(default=None, description="Optional site identifier"),
    comparator: TemporalComparator = Depends(_get_comparator),
) -> ComparisonResponse:
    """
    Detect deterioration between two photographs of the same heritage site.

    **How it works:**
    1. Both images are passed through the ViT expert inside the MoE model.
    2. The 768-dimensional CLS-token embedding of each image is extracted.
    3. Cosine distance between embeddings measures structural change.
    4. Severity scores (0–1) are computed independently for each image.
    5. `severity_delta = severity_t2 - severity_t1` (positive = worsening).

    **change_label values:**
    - `STABLE` — no significant visual change detected
    - `DETERIORATING` — damage progressing
    - `SIGNIFICANT_DETERIORATION` — large increase in damage, act immediately
    - `IMPROVING` — restoration appears effective
    - `SIGNIFICANT_IMPROVEMENT` — major improvement detected

    Use `site_id` to link results to the prediction history database.
    """
    moe_pred = model_registry.get("moe")
    if not moe_pred.is_loaded():
        raise HTTPException(
            status_code=503,
            detail="MoE model not loaded — temporal comparison unavailable.",
        )

    for f in (image_t1, image_t2):
        await ImageService.validate_upload(f)

    pil_t1 = await ImageService.read_as_pil(image_t1)
    pil_t2 = await ImageService.read_as_pil(image_t2)

    start = time.perf_counter()
    try:
        result = comparator.compare(pil_t1, pil_t2, site_id=site_id)
    except Exception as e:
        logger.error("Temporal comparison failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Comparison failed: {e}")

    elapsed = round((time.perf_counter() - start) * 1000, 2)

    return ComparisonResponse(
        site_id=site_id,
        change_detected=result["change_detected"],
        change_label=result["change_label"],
        cosine_distance=result["cosine_distance"],
        recommendation=result["recommendation"],
        predicted_class_t1=result["predicted_class_t1"],
        predicted_class_t2=result["predicted_class_t2"],
        severity_t1=result["severity_t1"],
        severity_t2=result["severity_t2"],
        severity_delta=result["severity_delta"],
        severity_label_t1=result["severity_label_t1"],
        severity_label_t2=result["severity_label_t2"],
        class_probs_t1=result["class_probs_t1"],
        class_probs_t2=result["class_probs_t2"],
        embedding_dim=result["embedding_dim"],
        inference_time_ms=elapsed,
        timestamp=datetime.utcnow(),
    )
