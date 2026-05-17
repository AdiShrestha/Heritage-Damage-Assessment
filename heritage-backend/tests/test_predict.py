from __future__ import annotations

"""Tests for prediction endpoints."""

import pytest
from app.utils.constants import CLASS_NAMES


@pytest.mark.anyio
async def test_predict_jpeg(client, sample_jpeg_bytes):
    files = {"file": ("test.jpg", sample_jpeg_bytes, "image/jpeg")}
    r = await client.post("/api/v1/predict/", files=files)
    assert r.status_code == 200
    data = r.json()
    assert "request_id" in data
    assert "model_used" in data
    assert data["inference_time_ms"] >= 0
    probs = data["class_probabilities"]
    total = sum([p["probability"] for p in probs])
    assert abs(total - 1.0) <= 0.01
    assert data["predicted_class"] in CLASS_NAMES
    assert "X-Request-ID" in r.headers


@pytest.mark.anyio
async def test_predict_png(client, sample_png_bytes):
    files = {"file": ("test.png", sample_png_bytes, "image/png")}
    r = await client.post("/api/v1/predict/", files=files)
    assert r.status_code == 200


@pytest.mark.anyio
async def test_predict_model_param(client, sample_jpeg_bytes):
    files = {"file": ("test.jpg", sample_jpeg_bytes, "image/jpeg")}
    r = await client.post("/api/v1/predict/?model_name=mock", files=files)
    assert r.status_code == 200
    assert r.json().get("model_used") == "mock"


@pytest.mark.anyio
async def test_predict_nonexistent_model(client, sample_jpeg_bytes):
    files = {"file": ("test.jpg", sample_jpeg_bytes, "image/jpeg")}
    r = await client.post("/api/v1/predict/?model_name=doesnotexist", files=files)
    assert r.status_code == 404
    data = r.json()
    assert data.get("error_code") == "MODEL_NOT_FOUND"


@pytest.mark.anyio
async def test_predict_with_text_file(client):
    files = {"file": ("test.txt", b"not an image", "text/plain")}
    r = await client.post("/api/v1/predict/", files=files)
    assert r.status_code in (415, 422)


@pytest.mark.anyio
async def test_predict_tiny_image(client, tiny_image_bytes):
    files = {"file": ("tiny.jpg", tiny_image_bytes, "image/jpeg")}
    r = await client.post("/api/v1/predict/", files=files)
    assert r.status_code == 422
    data = r.json()
    assert data.get("error_code") == "PREPROCESSING_ERROR"
