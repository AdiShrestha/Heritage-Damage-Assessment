# TARGET: app/services/batch_service.py
from __future__ import annotations

"""
Batch prediction service.

Accepts up to MAX_BATCH_SIZE images, runs MoE inference concurrently
(bounded by semaphore to avoid OOM), then returns results sorted by
severity score — highest urgency first (priority queue for restoration teams).
"""


import asyncio
import time
import uuid
from datetime import datetime
from typing import Any

from app.core.config import settings
from app.core.logging import get_logger
from app.ml.model_registry import ModelRegistry
from app.ml.severity_scorer import compute_severity, severity_to_label, batch_severity
from app.schemas.batch import (
    BatchPredictionResponse,
    BatchItemResult,
    BatchSummary,
)
from app.services.cache_service import prediction_cache
from app.services.image_service import ImageService
from app.services.prediction_service import PredictionService
from app.utils.constants import CRITICALITY_MAP

logger = get_logger(__name__)

MAX_BATCH_SIZE = 20
_CONCURRENCY_LIMIT = 4  # simultaneous GPU inferences — tune to VRAM


class BatchPredictionService:
    """Run predictions on a list of images and return a ranked priority report."""

    def __init__(self, registry: ModelRegistry) -> None:
        self._registry = registry
        self._prediction_service = PredictionService(registry)
        self._semaphore = asyncio.Semaphore(_CONCURRENCY_LIMIT)

    async def run_batch(
        self,
        images: list[tuple[str, Any]],  # [(filename, PIL_image), ...]
        model_name: str,
        batch_id: str | None = None,
    ) -> BatchPredictionResponse:
        """
        Args:
            images:     list of (filename, PIL.Image)
            model_name: which predictor to use
            batch_id:   optional caller-supplied ID; generated if absent
        """
        if not images:
            raise ValueError("images list is empty.")
        if len(images) > MAX_BATCH_SIZE:
            raise ValueError(
                f"Batch size {len(images)} exceeds limit {MAX_BATCH_SIZE}."
            )

        batch_id = batch_id or str(uuid.uuid4())
        batch_start = time.perf_counter()

        tasks = [
            self._predict_one(filename, image, model_name, batch_id, idx)
            for idx, (filename, image) in enumerate(images)
        ]
        results: list[BatchItemResult] = await asyncio.gather(*tasks)

        # Sort by severity descending — highest urgency first
        results.sort(key=lambda r: r.severity_score, reverse=True)

        total_ms = round((time.perf_counter() - batch_start) * 1000, 2)

        summary = self._build_summary(results, total_ms)
        return BatchPredictionResponse(
            batch_id=batch_id,
            model_used=model_name,
            total_images=len(results),
            results=results,
            summary=summary,
            total_inference_ms=total_ms,
            timestamp=datetime.utcnow(),
        )

    async def _predict_one(
        self,
        filename: str,
        image: Any,
        model_name: str,
        batch_id: str,
        idx: int,
    ) -> BatchItemResult:
        request_id = f"{batch_id}:{idx}"
        item_start = time.perf_counter()

        # Check cache first
        try:
            import io

            buf = io.BytesIO()
            image.save(buf, format="JPEG", quality=85)
            image_bytes = buf.getvalue()
        except Exception:
            image_bytes = b""

        cached = prediction_cache.get(image_bytes, model_name) if image_bytes else None
        if cached is not None:
            return self._to_batch_item(
                filename,
                cached,
                from_cache=True,
                elapsed_ms=round((time.perf_counter() - item_start) * 1000, 2),
            )

        async with self._semaphore:
            try:
                response = await self._prediction_service.run_prediction(
                    image, model_name, request_id
                )
                if image_bytes:
                    prediction_cache.set(image_bytes, model_name, response)
                return self._to_batch_item(
                    filename,
                    response,
                    from_cache=False,
                    elapsed_ms=round((time.perf_counter() - item_start) * 1000, 2),
                )
            except Exception as e:
                logger.error("Batch item %s failed: %s", filename, e)
                return BatchItemResult(
                    filename=filename,
                    predicted_class="ERROR",
                    confidence=0.0,
                    severity_score=0.0,
                    severity_label="UNKNOWN",
                    criticality="UNKNOWN",
                    class_probabilities={},
                    inference_time_ms=round(
                        (time.perf_counter() - item_start) * 1000, 2
                    ),
                    from_cache=False,
                    error=str(e),
                )

    @staticmethod
    def _to_batch_item(
        filename: str, response: Any, from_cache: bool, elapsed_ms: float
    ) -> BatchItemResult:
        probs = {cp.class_name: cp.probability for cp in response.class_probabilities}
        severity = compute_severity(probs)
        return BatchItemResult(
            filename=filename,
            predicted_class=response.predicted_class,
            confidence=response.confidence,
            severity_score=severity,
            severity_label=severity_to_label(severity),
            criticality=CRITICALITY_MAP.get(response.predicted_class, "UNKNOWN"),
            class_probabilities=probs,
            gradcam_image_base64=response.gradcam_image_base64,
            gate_weights=response.gate_weights,
            inference_time_ms=elapsed_ms,
            from_cache=from_cache,
            error=None,
        )

    @staticmethod
    def _build_summary(results: list[BatchItemResult], total_ms: float) -> BatchSummary:
        successful = [r for r in results if r.error is None]
        failed = len(results) - len(successful)

        class_counts: dict[str, int] = {}
        criticality_counts: dict[str, int] = {}
        for r in successful:
            class_counts[r.predicted_class] = class_counts.get(r.predicted_class, 0) + 1
            criticality_counts[r.criticality] = (
                criticality_counts.get(r.criticality, 0) + 1
            )

        avg_sev = (
            sum(r.severity_score for r in successful) / len(successful)
            if successful
            else 0.0
        )
        avg_conf = (
            sum(r.confidence for r in successful) / len(successful)
            if successful
            else 0.0
        )
        cache_hits = sum(1 for r in successful if r.from_cache)

        top = results[0] if results else None
        return BatchSummary(
            successful=len(successful),
            failed=failed,
            cache_hits=cache_hits,
            avg_severity_score=round(avg_sev, 4),
            avg_confidence=round(avg_conf, 4),
            class_distribution=class_counts,
            criticality_distribution=criticality_counts,
            highest_priority_file=top.filename if top else None,
            highest_priority_severity=top.severity_score if top else None,
            total_inference_ms=total_ms,
        )
