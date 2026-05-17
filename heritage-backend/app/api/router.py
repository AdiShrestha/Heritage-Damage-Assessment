from __future__ import annotations

"""API router that composes versioned routers."""

from fastapi import APIRouter

from app.api.v1.endpoints import predict, health, models

api_router = APIRouter()
api_router.include_router(predict.router)
api_router.include_router(health.router)
api_router.include_router(models.router)
