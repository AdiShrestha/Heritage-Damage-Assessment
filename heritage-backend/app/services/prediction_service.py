from __future__ import annotations

"""Prediction orchestration service."""

import asyncio
import time
from datetime import datetime
from typing import Any

from app.core.logging import get_logger
from app.ml.model_registry import ModelRegistry
from app.ml.preprocessing import PreprocessingPipeline
from app.services.image_service import ImageService
from app.schemas.prediction import PredictionResponse, ClassProbability
from app.core.exceptions import InferenceError, PreprocessingError

logger = get_logger(__name__)


class PredictionService:
    """Coordinate preprocessing, inference, and response formatting."""

    def __init__(self, registry: ModelRegistry) -> None:
        self._registry = registry
        self._preprocessing = PreprocessingPipeline()
        self._logger = get_logger(__name__)

    async def run_prediction(
        self, image: Any, model_name: str, request_id: str
    ) -> PredictionResponse:
        """Run the full prediction pipeline and return a schema instance."""
        self._logger.debug(
            "Starting prediction", extra={"request_id": request_id, "model": model_name}
        )
        predictor = self._registry.get(model_name)

        loop = asyncio.get_event_loop()
        start = time.perf_counter()

        try:
            preprocessed = await loop.run_in_executor(
                None, self._preprocessing.preprocess, image
            )

            result = await loop.run_in_executor(None, predictor.predict, image)
        except (InferenceError, PreprocessingError):
            raise
        except Exception as e:
            self._logger.error(
                "Unexpected inference error: %s",
                str(e),
                extra={"request_id": request_id},
            )
            raise InferenceError(message=f"Prediction failed: {str(e)}")

        inference_time_ms = (time.perf_counter() - start) * 1000

        gradcam_b64: str | None = None
        if result.gradcam_image is not None:
            try:
                gradcam_b64 = ImageService.pil_to_base64(result.gradcam_image)
            except Exception:
                self._logger.warning(
                    "Grad-CAM encoding failed, skipping.",
                    extra={"request_id": request_id},
                )

        self._logger.debug(
            "Prediction complete in %.2fms",
            inference_time_ms,
            extra={"request_id": request_id},
        )

        return PredictionResponse(
            request_id=request_id,
            model_used=model_name,
            predicted_class=result.predicted_class,
            confidence=result.confidence,
            class_probabilities=[
                ClassProbability(class_name=k, probability=v)
                for k, v in result.class_probabilities.items()
            ],
            gradcam_image_base64=gradcam_b64,
            inference_time_ms=round(inference_time_ms, 2),
            image_dimensions=ImageService.get_dimensions(image),
            detections=result.detections if result.detections else None,
            timestamp=datetime.utcnow(),
        )
