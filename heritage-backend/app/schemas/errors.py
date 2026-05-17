from __future__ import annotations

"""Error response schemas."""

from datetime import datetime
from typing import List

from pydantic import BaseModel
from pydantic import ConfigDict


class ErrorDetail(BaseModel):
    field: str | None = None
    message: str


class ErrorResponse(BaseModel):
    request_id: str
    error_code: str
    message: str
    details: List[ErrorDetail] = []
    timestamp: datetime

    model_config = ConfigDict(json_encoders={datetime: lambda v: v.isoformat()})
