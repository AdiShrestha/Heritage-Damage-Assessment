from __future__ import annotations

"""Tests for health endpoints."""

import pytest


@pytest.mark.anyio
async def test_health_liveness(client):
    r = await client.get("/api/v1/health/")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] in ("ok", "degraded")
    assert data["uptime_seconds"] >= 0
    models = data.get("models", [])
    names = [m["name"] for m in models]
    assert "mock" in names


@pytest.mark.anyio
async def test_health_ready(client):
    r = await client.get("/api/v1/health/ready")
    assert r.status_code in (200, 503)
    data = r.json()
    assert "ready" in data and "checks" in data
