from __future__ import annotations

"""Dependency providers for API endpoints."""

from functools import lru_cache
from uuid import uuid4
from fastapi import Request

from app.services.image_service import ImageService
from app.services.prediction_service import PredictionService
from app.ml.model_registry import model_registry, ModelRegistry


def get_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", str(uuid4()))


def get_image_service() -> ImageService:
    return ImageService()


@lru_cache(maxsize=1)
def _get_prediction_service() -> PredictionService:
    return PredictionService(registry=model_registry)


def get_prediction_service() -> PredictionService:
    return _get_prediction_service()


def get_model_registry() -> ModelRegistry:
    return model_registry
