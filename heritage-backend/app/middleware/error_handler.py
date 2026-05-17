from __future__ import annotations

"""Register exception handlers on FastAPI app."""

from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.logging import get_logger
from app.core.config import settings
from app.core.exceptions import AppException
from app.schemas.errors import ErrorResponse, ErrorDetail

logger = get_logger(__name__)


def register_exception_handlers(app: FastAPI) -> None:
    """Attach handlers for AppException, validation errors, and generic errors."""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorResponse(
                request_id=getattr(request.state, "request_id", "unknown"),
                error_code=exc.error_code,
                message=exc.message,
                timestamp=datetime.utcnow(),
            ).model_dump(mode="json"),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        details = [ErrorDetail(field=str(e["loc"]), message=e["msg"]) for e in exc.errors()]
        return JSONResponse(
            status_code=422,
            content=ErrorResponse(
                request_id=getattr(request.state, "request_id", "unknown"),
                error_code="VALIDATION_ERROR",
                message="Request validation failed.",
                details=details,
                timestamp=datetime.utcnow(),
            ).model_dump(mode="json"),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.error("Unhandled exception: %s", str(exc), exc_info=True, extra={"request_id": getattr(request.state, "request_id", "unknown")})
        message = str(exc) if settings.DEBUG else "An internal server error occurred."
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(
                request_id=getattr(request.state, "request_id", "unknown"),
                error_code="INTERNAL_SERVER_ERROR",
                message=message,
                timestamp=datetime.utcnow(),
            ).model_dump(mode="json"),
        )
