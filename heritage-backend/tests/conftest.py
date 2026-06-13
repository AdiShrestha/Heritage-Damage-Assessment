from __future__ import annotations

"""Test fixtures for the FastAPI app."""

import pytest
from httpx import AsyncClient, ASGITransport
from PIL import Image
import io
import asyncio

from app.main import app
from app.ml.model_registry import model_registry


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    # Manually load models because ASGITransport might not run lifespan properly in some versions
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, model_registry.load_all)
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.fixture
def sample_jpeg_bytes() -> bytes:
    img = Image.new("RGB", (224, 224), color=(180, 100, 80))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture
def sample_png_bytes() -> bytes:
    img = Image.new("RGB", (512, 512), color=(100, 150, 200))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture
def tiny_image_bytes() -> bytes:
    img = Image.new("RGB", (10, 10), color=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()
