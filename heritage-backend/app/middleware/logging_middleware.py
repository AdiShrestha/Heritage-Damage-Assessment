from __future__ import annotations

"""Middleware that logs request/response summary."""

import time
import logging
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, Response

from app.core.logging import get_logger


class LoggingMiddleware(BaseHTTPMiddleware):
    """Log basic request/response metrics."""

    def __init__(self, app) -> None:
        super().__init__(app)
        self._logger = get_logger(__name__)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start = time.perf_counter()
        request_id = getattr(request.state, "request_id", "unknown")
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000
        log_data = {
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": round(duration_ms, 2),
        }
        level = logging.ERROR if response.status_code >= 500 else logging.INFO
        self._logger.log(level, "Request completed", extra=log_data)
        return response
