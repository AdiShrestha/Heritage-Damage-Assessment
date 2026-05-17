from __future__ import annotations

"""Prediction endpoints."""

from datetime import datetime
from typing import Any

from fastapi import APIRouter, UploadFile, File, Query, Depends

from app.api.v1.dependencies import get_request_id, get_image_service, get_prediction_service
from app.services.image_service import ImageService
from app.services.prediction_service import PredictionService
from app.schemas.prediction import PredictionResponse
from app.schemas.errors import ErrorResponse

router = APIRouter(prefix="/predict", tags=["Prediction"])


@router.post(
    "/",
    response_model=PredictionResponse,
    responses={
        413: {"model": ErrorResponse, "description": "File too large"},
        415: {"model": ErrorResponse, "description": "Unsupported image format"},
        422: {"model": ErrorResponse, "description": "Invalid image or validation error"},
        404: {"model": ErrorResponse, "description": "Requested model not found"},
        500: {"model": ErrorResponse, "description": "Inference failed"},
    },
    summary="Assess structural damage in a heritage site image",
)
async def predict_damage(
    file: UploadFile = File(..., description="Image file (JPEG/PNG/WebP, max 10MB)"),
    model_name: str = Query(default="mock", description="Model to use: mock | resnet50 | efficientnet_b4 | vit_b16"),
    request_id: str = Depends(get_request_id),
    image_service: ImageService = Depends(get_image_service),
    prediction_service: PredictionService = Depends(get_prediction_service),
) -> PredictionResponse:
    await image_service.validate_upload(file)
    image = await image_service.read_as_pil(file)
    return await prediction_service.run_prediction(image, model_name, request_id)
