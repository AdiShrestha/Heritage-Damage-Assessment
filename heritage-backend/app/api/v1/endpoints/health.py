from __future__ import annotations

"""Health endpoints to check liveness and readiness."""

from datetime import datetime
from fastapi import APIRouter, Depends, Response

from app.api.v1.dependencies import get_model_registry
from app.ml.model_registry import model_registry
from app.schemas.health import HealthResponse, ModelStatus, ReadinessResponse
from app.core.config import settings

_START_TIME: datetime = datetime.utcnow()

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/", response_model=HealthResponse)
async def liveness(registry=Depends(get_model_registry)) -> HealthResponse:
    uptime = (datetime.utcnow() - _START_TIME).total_seconds()
    models = [ModelStatus(**m) for m in registry.list_models()]
    status = "ok" if registry.is_healthy() else "degraded"
    return HealthResponse(
        status=status,
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        uptime_seconds=round(uptime, 2),
        models=models,
        timestamp=datetime.utcnow(),
    )


@router.get("/ready", response_model=ReadinessResponse)
async def readiness(response: Response, registry=Depends(get_model_registry)) -> ReadinessResponse:
    weights_dir_ok = settings.MODEL_WEIGHTS_DIR.exists()
    model_registry_ok = registry.is_healthy()
    ready = model_registry_ok
    checks = {"model_registry": model_registry_ok, "weights_dir": weights_dir_ok}
    if not ready:
        response.status_code = 503
    return ReadinessResponse(ready=ready, checks=checks)
