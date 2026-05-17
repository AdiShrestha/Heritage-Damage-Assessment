from __future__ import annotations

"""Logging setup utilities."""

import logging

from pythonjsonlogger import jsonlogger

from app.core.config import settings


def setup_logging() -> None:
    """Configure root logger based on settings."""
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    root = logging.getLogger()
    root.setLevel(level)

    # Clear existing handlers
    for h in list(root.handlers):
        root.removeHandler(h)

    handler = logging.StreamHandler()
    if settings.LOG_FORMAT == "json":
        fmt = jsonlogger.JsonFormatter("%(asctime)s %(levelname)s %(name)s %(message)s %(request_id)s")
        handler.setFormatter(fmt)
    else:
        fmt = logging.Formatter("%(asctime)s - %(levelname)s - %(name)s - %(message)s")
        handler.setFormatter(fmt)

    root.addHandler(handler)


def get_logger(name: str) -> logging.Logger:
    """Return a logger by name."""
    return logging.getLogger(name)
