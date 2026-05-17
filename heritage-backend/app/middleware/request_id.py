from __future__ import annotations

"""Middleware to assign and propagate request IDs."""

from typing import Callable
from uuid import uuid4

from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, Response


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Attach X-Request-ID to request.state and response headers."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = request.headers.get("X-Request-ID", str(uuid4()))
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
