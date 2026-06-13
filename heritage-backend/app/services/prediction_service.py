# # TARGET: app/services/prediction_service.py
# from __future__ import annotations

# """Prediction orchestration — integrates severity, disagreement, cache, history."""

# import asyncio
# import io
# import time
# from datetime import datetime
# from typing import Any

# from app.core.logging import get_logger
# from app.ml.expert_disagreement import compute_disagreement
# from app.ml.model_registry import ModelRegistry
# from app.ml.preprocessing import PreprocessingPipeline
# from app.ml.severity_scorer import compute_severity, severity_to_label
# from app.services.cache_service import prediction_cache
# from app.services.image_service import ImageService
# from app.schemas.prediction import (
#     ClassProbability, ExpertPrediction, PredictionResponse,
# )
# from app.core.exceptions import InferenceError, PreprocessingError

# logger = get_logger(__name__)


# class PredictionService:
#     """Coordinate preprocessing, inference, and response formatting."""

#     def __init__(self, registry: ModelRegistry) -> None:
#         self._registry      = registry
#         self._preprocessing = PreprocessingPipeline()

#     async def run_prediction(
#         self, image: Any, model_name: str, request_id: str,
#         use_cache: bool = True,
#     ) -> PredictionResponse:

#         # ── Cache lookup ──────────────────────────────────────────────────────
#         image_bytes: bytes | None = None
#         if use_cache:
#             try:
#                 buf = io.BytesIO()
#                 image.save(buf, format="JPEG", quality=85)
#                 image_bytes = buf.getvalue()
#                 cached = prediction_cache.get(image_bytes, model_name)
#                 if cached is not None:
#                     logger.debug("Cache hit", extra={"request_id": request_id})
#                     return cached
#             except Exception:
#                 image_bytes = None   # cache unavailable — continue normally

#         predictor = self._registry.get(model_name)
#         loop      = asyncio.get_event_loop()
#         start     = time.perf_counter()

#         # ── Inference ─────────────────────────────────────────────────────────
#         try:
#             preprocessed = await loop.run_in_executor(
#                 None, self._preprocessing.preprocess, image
#             )
#             input_data = (preprocessed["tensor"]
#                           if preprocessed.get("tensor") is not None else image)
#             result = await loop.run_in_executor(None, predictor.predict, input_data)
#         except (InferenceError, PreprocessingError):
#             raise
#         except Exception as e:
#             logger.error("Inference error: %s", e,
#                          extra={"request_id": request_id})
#             raise InferenceError(message=f"Prediction failed: {e}")

#         inference_time_ms = (time.perf_counter() - start) * 1000

#         # ── Grad-CAM encoding ─────────────────────────────────────────────────
#         gradcam_b64: str | None = None
#         if result.gradcam_image is not None:
#             try:
#                 gradcam_b64 = ImageService.pil_to_base64(result.gradcam_image, fmt="PNG")
#             except Exception as e:
#                 logger.warning("Composite image encoding failed: %s", e,
#                                extra={"request_id": request_id})
#         else:
#             logger.warning("Predictor returned no visualization",
#                            extra={"request_id": request_id})

#         # ── Severity score ────────────────────────────────────────────────────
#         class_probs_dict = result.class_probabilities
#         severity_score   = compute_severity(class_probs_dict)
#         severity_label   = severity_to_label(severity_score)

#         # ── Expert disagreement ───────────────────────────────────────────────
#         raw_per_expert = getattr(result, "per_expert", None) or []
#         disagreement   = compute_disagreement(raw_per_expert, result.predicted_class)

#         # ── Build per-expert schema list ──────────────────────────────────────
#         per_expert_out: list[ExpertPrediction] | None = None
#         if raw_per_expert:
#             per_expert_out = [
#                 ExpertPrediction(
#                     expert          = ep["expert"],
#                     predicted_class = ep["class"],
#                     confidence      = round(ep["confidence"], 4),
#                     gate_weight     = round(ep.get("gate_weight", 0.0), 4),
#                 )
#                 for ep in raw_per_expert
#             ]

#         logger.info(
#             "Prediction done in %.1fms | class=%s conf=%.3f sev=%.3f crit=%s disagree=%.3f%s",
#             inference_time_ms,
#             result.predicted_class,
#             result.confidence,
#             severity_score,
#             getattr(result, "criticality", "n/a"),
#             disagreement["disagreement_score"],
#             " [REVIEW]" if disagreement["requires_human_review"] else "",
#             extra={"request_id": request_id},
#         )

#         response = PredictionResponse(
#             request_id             = request_id,
#             model_used             = model_name,
#             predicted_class        = result.predicted_class,
#             confidence             = result.confidence,
#             class_probabilities    = [
#                 ClassProbability(class_name=k, probability=v)
#                 for k, v in class_probs_dict.items()
#             ],
#             gradcam_image_base64   = gradcam_b64,
#             inference_time_ms      = round(inference_time_ms, 2),
#             image_dimensions       = ImageService.get_dimensions(image),
#             detections             = result.detections or None,
#             timestamp              = datetime.utcnow(),
#             # MoE fields
#             criticality            = getattr(result, "criticality", None),
#             gate_weights           = getattr(result, "gate_weights", None),
#             per_expert_predictions = per_expert_out,
#             used_gate              = getattr(result, "used_gate", None),
#             # Severity
#             severity_score         = round(severity_score, 4),
#             severity_label         = severity_label,
#             # Disagreement
#             disagreement_score     = disagreement["disagreement_score"],
#             expert_votes           = disagreement["expert_votes"],
#             requires_human_review  = disagreement["requires_human_review"],
#         )

#         # ── Store in cache ────────────────────────────────────────────────────
#         if use_cache and image_bytes:
#             try:
#                 prediction_cache.set(image_bytes, model_name, response)
#             except Exception:
#                 pass

#         return response

# TARGET: app/services/prediction_service.py
from __future__ import annotations

"""Prediction orchestration — integrates severity, disagreement, cache, history."""

import asyncio
import io
import time
from datetime import datetime
from typing import Any

from app.core.logging import get_logger
from app.ml.expert_disagreement import compute_disagreement
from app.ml.model_registry import ModelRegistry
from app.ml.preprocessing import PreprocessingPipeline
from app.ml.severity_scorer import compute_severity, severity_to_label
from app.services.cache_service import prediction_cache
from app.services.image_service import ImageService
from app.schemas.prediction import (
    ClassProbability,
    ExpertPrediction,
    PredictionResponse,
)
from app.core.exceptions import InferenceError, PreprocessingError

logger = get_logger(__name__)


class PredictionService:
    """Coordinate preprocessing, inference, and response formatting."""

    def __init__(self, registry: ModelRegistry) -> None:
        self._registry = registry
        self._preprocessing = PreprocessingPipeline()

    async def run_prediction(
        self,
        image: Any,
        model_name: str,
        request_id: str,
        use_cache: bool = True,
    ) -> PredictionResponse:
        # ── Cache lookup ──────────────────────────────────────────────────────
        image_bytes: bytes | None = None
        if use_cache:
            try:
                buf = io.BytesIO()
                image.save(buf, format="JPEG", quality=85)
                image_bytes = buf.getvalue()
                cached = prediction_cache.get(image_bytes, model_name)
                if cached is not None:
                    logger.debug("Cache hit", extra={"request_id": request_id})
                    return cached
            except Exception:
                image_bytes = None  # cache unavailable — continue normally

        predictor = self._registry.get(model_name)
        loop = asyncio.get_event_loop()
        start = time.perf_counter()

        # ── Inference ─────────────────────────────────────────────────────────
        try:
            preprocessed = await loop.run_in_executor(
                None, self._preprocessing.preprocess, image
            )
            result = await loop.run_in_executor(None, predictor.predict, image)
        except (InferenceError, PreprocessingError):
            raise
        except Exception as e:
            logger.error("Inference error: %s", e, extra={"request_id": request_id})
            raise InferenceError(message=f"Prediction failed: {e}")

        inference_time_ms = (time.perf_counter() - start) * 1000

        # ── Grad-CAM encoding ─────────────────────────────────────────────────
        gradcam_b64: str | None = None
        if result.gradcam_image is not None:
            try:
                gradcam_b64 = ImageService.pil_to_base64(
                    result.gradcam_image, fmt="PNG"
                )
            except Exception as e:
                logger.warning(
                    "Composite image encoding failed: %s",
                    e,
                    extra={"request_id": request_id},
                )
        else:
            logger.warning(
                "Predictor returned no visualization", extra={"request_id": request_id}
            )

        # ── Severity score ────────────────────────────────────────────────────
        class_probs_dict = result.class_probabilities
        severity_score = compute_severity(class_probs_dict)
        severity_label = severity_to_label(severity_score)

        # ── Expert disagreement ───────────────────────────────────────────────
        raw_per_expert = getattr(result, "per_expert", None) or []
        disagreement = compute_disagreement(raw_per_expert, result.predicted_class)

        # ── Build per-expert schema list ──────────────────────────────────────
        per_expert_out: list[ExpertPrediction] | None = None
        if raw_per_expert:
            per_expert_out = [
                ExpertPrediction(
                    expert=ep["expert"],
                    predicted_class=ep["class"],
                    confidence=round(ep["confidence"], 4),
                    gate_weight=round(ep.get("gate_weight", 0.0), 4),
                )
                for ep in raw_per_expert
            ]

        logger.info(
            "Prediction done in %.1fms | class=%s conf=%.3f sev=%.3f crit=%s disagree=%.3f%s",
            inference_time_ms,
            result.predicted_class,
            result.confidence,
            severity_score,
            getattr(result, "criticality", "n/a"),
            disagreement["disagreement_score"],
            " [REVIEW]" if disagreement["requires_human_review"] else "",
            extra={"request_id": request_id},
        )

        response = PredictionResponse(
            request_id=request_id,
            model_used=model_name,
            predicted_class=result.predicted_class,
            confidence=result.confidence,
            class_probabilities=[
                ClassProbability(class_name=k, probability=v)
                for k, v in class_probs_dict.items()
            ],
            gradcam_image_base64=gradcam_b64,
            inference_time_ms=round(inference_time_ms, 2),
            image_dimensions=ImageService.get_dimensions(image),
            detections=result.detections or None,
            timestamp=datetime.utcnow(),
            # MoE fields
            criticality=getattr(result, "criticality", None),
            gate_weights=getattr(result, "gate_weights", None),
            per_expert_predictions=per_expert_out,
            used_gate=getattr(result, "used_gate", None),
            # Severity
            severity_score=round(severity_score, 4),
            severity_label=severity_label,
            # Disagreement
            disagreement_score=disagreement["disagreement_score"],
            expert_votes=disagreement["expert_votes"],
            requires_human_review=disagreement["requires_human_review"],
        )

        # ── Store in cache ────────────────────────────────────────────────────
        if use_cache and image_bytes:
            try:
                prediction_cache.set(image_bytes, model_name, response)
            except Exception:
                pass

        return response
