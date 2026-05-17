from __future__ import annotations

"""Health check schemas."""

from datetime import datetime
from typing import List, Literal

from pydantic import BaseModel
from pydantic import ConfigDict


class ModelStatus(BaseModel):
    name: str
    loaded: bool
    version: str


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded", "error"]
    app_name: str
    version: str
    environment: str
    uptime_seconds: float
    models: List[ModelStatus]
    timestamp: datetime


class ReadinessResponse(BaseModel):
    ready: bool
    checks: dict[str, bool]

    model_config = ConfigDict(json_encoders={datetime: lambda v: v.isoformat()})
