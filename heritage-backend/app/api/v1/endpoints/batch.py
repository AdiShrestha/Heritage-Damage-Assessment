# TARGET: app/api/v1/endpoints/batch.py
from __future__ import annotations

"""
POST /api/v1/predict/batch

Accepts up to 20 images, runs MoE inference concurrently,
returns results sorted by severity (highest urgency first).

Useful for restoration teams assessing a set of temples in one call.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, File, Query, Request, UploadFile, HTTPException
from fastapi import Depends

from app.core.config import settings
from app.core.logging import get_logger
from app.ml.model_registry import model_registry
from app.schemas.batch import BatchPredictionResponse
from app.services.batch_service import BatchPredictionService
from app.services.image_service import ImageService

logger = get_logger(__name__)

router = APIRouter(prefix="/predict/batch", tags=["Batch Prediction"])

_MAX_FILES = 20


def _get_batch_service() -> BatchPredictionService:
    return BatchPredictionService(model_registry)


@router.post(
    "", response_model=BatchPredictionResponse, summary="Batch damage assessment"
)
async def batch_predict(
    request: Request,
    files: Annotated[
        list[UploadFile], File(description=f"Up to {_MAX_FILES} temple images")
    ],
    model: str = Query(default="moe", description="Model to use for all images"),
    service: BatchPredictionService = Depends(_get_batch_service),
) -> BatchPredictionResponse:
    """
    Submit multiple temple images for damage assessment in one request.

    Results are returned **sorted by severity score descending** —
    the most critically damaged site is always first.

    Each item includes:
    - `predicted_class`, `confidence`, `criticality`
    - `severity_score` (continuous 0–1)
    - `gradcam_image_base64` — damage heatmap composite
    - `gate_weights` — how the MoE weighted each expert

    The `summary` block gives aggregate stats:
    class/criticality distribution, highest-priority file, cache hit count.
    """
    if not files:
        raise HTTPException(status_code=422, detail="No files provided.")
    if len(files) > _MAX_FILES:
        raise HTTPException(
            status_code=422,
            detail=f"Maximum {_MAX_FILES} images per batch (received {len(files)}).",
        )

    batch_id = str(uuid.uuid4())
    images: list[tuple[str, object]] = []

    for upload in files:
        try:
            await ImageService.validate_upload(upload)
            pil = await ImageService.read_as_pil(upload)
            images.append((upload.filename or "unknown", pil))
        except Exception as e:
            logger.warning("Skipping %s — validation failed: %s", upload.filename, e)
            # Partial failure: skip bad files, process the rest
            continue

    if not images:
        raise HTTPException(
            status_code=422,
            detail="All uploaded files failed validation.",
        )

    return await service.run_batch(images, model_name=model, batch_id=batch_id)
