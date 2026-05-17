from __future__ import annotations

"""Model listing endpoints."""

from fastapi import APIRouter, Depends

from app.api.v1.dependencies import get_model_registry
from app.schemas.health import ModelStatus

router = APIRouter(prefix="/models", tags=["Models"])


@router.get("/", response_model=list[ModelStatus])
async def list_models(registry=Depends(get_model_registry)):
    return [ModelStatus(**m) for m in registry.list_models()]


@router.get("/{model_name}", response_model=ModelStatus)
async def get_model(model_name: str, registry=Depends(get_model_registry)):
    predictor = registry.get(model_name)
    return ModelStatus(name=model_name, loaded=predictor.is_loaded(), version=predictor.model_version)
