# from __future__ import annotations

# """FastAPI application factory and startup/shutdown lifecycle."""

# from contextlib import asynccontextmanager
# from datetime import datetime
# from typing import AsyncGenerator

# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware

# from app.core.config import settings
# from app.core.logging import setup_logging, get_logger
# from app.ml.model_registry import model_registry
# from app.middleware.error_handler import register_exception_handlers
# from app.middleware.logging_middleware import LoggingMiddleware
# from app.middleware.request_id import RequestIDMiddleware
# from app.api.router import api_router
# import asyncio

# APP_START_TIME = datetime.utcnow()


# @asynccontextmanager
# async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
#     setup_logging()
#     logger = get_logger(__name__)
#     logger.info(
#         "Starting %s v%s [%s]",
#         settings.APP_NAME,
#         settings.APP_VERSION,
#         settings.ENVIRONMENT,
#     )
#     # Load models in executor — prevents blocking the event loop on large weight files
#     loop = asyncio.get_event_loop()
#     await loop.run_in_executor(None, model_registry.load_all)
#     loaded = [m["name"] for m in model_registry.list_models() if m["loaded"]]
#     logger.info("Models loaded: %s", loaded)
#     yield
#     logger.info("Shutting down %s", settings.APP_NAME)


# app = FastAPI(
#     title=settings.APP_NAME,
#     description=settings.APP_DESCRIPTION,
#     version=settings.APP_VERSION,
#     lifespan=lifespan,
#     docs_url="/docs" if settings.DEBUG else None,
#     redoc_url="/redoc" if settings.DEBUG else None,
#     openapi_url="/openapi.json" if settings.DEBUG else None,
# )

# app.add_middleware(LoggingMiddleware)
# app.add_middleware(RequestIDMiddleware)
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=settings.allowed_origins_list,
#     allow_credentials=True,
#     allow_methods=["GET", "POST"],
#     allow_headers=["*"],
#     expose_headers=["X-Request-ID"],
# )

# register_exception_handlers(app)
# app.include_router(api_router, prefix=settings.API_V1_PREFIX)


# @app.get("/", tags=["Root"])
# async def root() -> dict[str, str]:
#     return {
#         "app": settings.APP_NAME,
#         "version": settings.APP_VERSION,
#         "docs": "/docs" if settings.DEBUG else "disabled in production",
#     }

from __future__ import annotations
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime
from typing import AsyncGenerator
import torch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.core.config import settings
from app.core.logging import get_logger, setup_logging
from app.middleware.error_handler import register_exception_handlers
from app.middleware.logging_middleware import LoggingMiddleware
from app.middleware.request_id import RequestIDMiddleware
from app.ml.model_registry import model_registry
from app.services import history_service as hs_module
from app.services.cache_service import prediction_cache
from app.services.history_service import HistoryService

APP_START_TIME = datetime.utcnow()


async def _warmup(logger) -> None:
    dummy = torch.zeros(1, 3, 224, 224)
    for info in model_registry.list_models():
        if not info["loaded"]:
            continue
        try:
            predictor = model_registry.get(info["name"])
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, predictor.predict, dummy)
            logger.info("Warm-up done: %s", info["name"])
        except Exception as e:
            logger.warning("Warm-up failed for %s: %s", info["name"], e)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    setup_logging()
    logger = get_logger(__name__)
    logger.info(
        "Starting %s v%s [%s]",
        settings.APP_NAME,
        settings.APP_VERSION,
        settings.ENVIRONMENT,
    )

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, model_registry.load_all)
    loaded = [m["name"] for m in model_registry.list_models() if m["loaded"]]
    logger.info("Models loaded: %s", loaded)

    if settings.WARMUP_ON_STARTUP and loaded:
        try:
            await _warmup(logger)
        except Exception as e:
            logger.warning("Warm-up skipped: %s", e)

    hist = HistoryService(settings.HISTORY_DB_PATH)
    await hist.init()
    hs_module.history_service = hist

    prediction_cache._ttl = settings.CACHE_TTL_SECONDS
    prediction_cache._max_entries = settings.CACHE_MAX_ENTRIES

    logger.info("Startup complete.")
    yield
    logger.info("Shutting down %s", settings.APP_NAME)


app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)

app.add_middleware(LoggingMiddleware)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)

register_exception_handlers(app)
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["Root"])
async def root() -> dict:
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs" if settings.DEBUG else "disabled",
    }
