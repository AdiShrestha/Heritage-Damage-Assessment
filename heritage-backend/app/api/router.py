from __future__ import annotations

"""API router that composes versioned routers."""

from fastapi import APIRouter
from app.api.v1.endpoints import predict, health, models, batch, compare, report
from app.api.v1.endpoints.uncertainty_cache import uncertainty_router, cache_router

api_router = APIRouter()
api_router.include_router(predict.router)
api_router.include_router(health.router)
api_router.include_router(models.router)
api_router.include_router(batch.router)
api_router.include_router(compare.router)
api_router.include_router(report.router)
api_router.include_router(uncertainty_router)
api_router.include_router(cache_router)
