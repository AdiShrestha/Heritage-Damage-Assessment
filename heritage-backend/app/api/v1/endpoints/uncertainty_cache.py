# TARGET: app/api/v1/endpoints/uncertainty_cache.py
from __future__ import annotations

"""
POST /api/v1/predict/uncertainty  — MC Dropout uncertainty estimate
GET  /api/v1/cache/stats          — cache statistics
DELETE /api/v1/cache              — invalidate cache
"""

import uuid
import time
from typing import Any

from fastapi import APIRouter, File, Query, Request, UploadFile, HTTPException

from app.core.logging import get_logger
from app.ml.model_registry import model_registry
from app.ml.uncertainty import UncertaintyEstimator
from app.services.cache_service import prediction_cache
from app.services.image_service import ImageService

import numpy as np
import torch

logger = get_logger(__name__)

uncertainty_router = APIRouter(prefix="/predict/uncertainty", tags=["Uncertainty"])
cache_router = APIRouter(prefix="/cache", tags=["Cache"])


# ─── Uncertainty ──────────────────────────────────────────────────────────────


@uncertainty_router.post("", summary="MC Dropout uncertainty estimation")
async def estimate_uncertainty(
    request: Request,
    file: UploadFile = File(...),
    n_passes: int = Query(
        default=15, ge=5, le=50, description="Number of stochastic forward passes"
    ),
) -> dict[str, Any]:
    """
    Runs the MoE model **N times with dropout active** and measures how
    much the predictions vary across passes.

    Returns:
    - `predicted_class` — most common class across passes
    - `confidence` — mean confidence of the predicted class
    - `epistemic_std` — std-dev of class probabilities (model uncertainty)
    - `predictive_entropy` — entropy of the mean distribution (0 = certain)
    - `uncertain_flag` — True if entropy exceeds threshold (0.60 nats)
    - `expert_agreement_rate` — fraction of passes where all experts agreed
    - `recommendation` — whether to trust this prediction or flag for review

    **When to use this endpoint:**
    Submit images that the standard `/predict` endpoint returned with low
    confidence or high disagreement_score. If `uncertain_flag` is True,
    do not act on the automated prediction alone — schedule a manual survey.
    """
    moe_pred = model_registry.get("moe")
    if not moe_pred.is_loaded():
        raise HTTPException(status_code=503, detail="MoE model not loaded.")

    await ImageService.validate_upload(file)
    image = await ImageService.read_as_pil(file)

    # Preprocess
    pil = image.convert("RGB").resize((224, 224))
    arr = np.array(pil).astype(np.float32) / 255.0
    arr = (arr - np.array([0.485, 0.456, 0.406])) / np.array([0.229, 0.224, 0.225])
    tensor = torch.from_numpy(arr.transpose(2, 0, 1)).unsqueeze(0).float()
    tensor = tensor.to(moe_pred._device)

    start = time.perf_counter()
    estimator = UncertaintyEstimator(moe_pred, n_passes=n_passes)
    result = estimator.estimate(tensor)
    elapsed = round((time.perf_counter() - start) * 1000, 2)

    result["inference_time_ms"] = elapsed
    result["recommendation"] = (
        "Prediction is uncertain — schedule manual inspection."
        if result.get("uncertain_flag")
        else "Prediction confidence is acceptable."
    )
    return result


# ─── Cache management ─────────────────────────────────────────────────────────


@cache_router.get("/stats", summary="Prediction cache statistics")
async def cache_stats() -> dict[str, Any]:
    """
    Returns current cache state:
    - `live_entries` — entries still within TTL
    - `expired_entries` — entries past TTL (evicted on next access)
    - `ttl_seconds` — configured time-to-live per entry
    - `max_entries` — maximum cache size before LRU eviction
    """
    return prediction_cache.stats()


@cache_router.delete("", summary="Invalidate prediction cache")
async def invalidate_cache(
    model: str | None = Query(
        default=None,
        description="Model name to invalidate. Omit to clear entire cache.",
    ),
) -> dict[str, Any]:
    """
    Clear cached predictions. Use after reloading model weights
    so stale results are not served to the frontend.
    """
    n = prediction_cache.invalidate(model_name=model)
    return {
        "invalidated": n,
        "model": model or "all",
        "message": f"Removed {n} cache entries.",
    }
