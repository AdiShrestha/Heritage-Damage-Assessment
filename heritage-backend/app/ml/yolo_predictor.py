from __future__ import annotations

"""YOLO predictor aligned to temple classification output."""

from pathlib import Path
from typing import Any

from app.ml.base_predictor import BasePredictor, PredictionResult
from app.core.logging import get_logger
from app.core.exceptions import InferenceError

logger = get_logger(__name__)

try:
    from ultralytics import YOLO

    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False


class YOLOPredictor(BasePredictor):
    """YOLO predictor for temple classification."""

    def __init__(self) -> None:
        self._model = None
        self._loaded = False
        self._device = "cpu"
        self._class_names: dict[int, str] = {}

    def load_model(self, weights_path: Path | None = None) -> None:
        """Load trained YOLO model weights."""
        if not YOLO_AVAILABLE:
            logger.error("ultralytics not installed. YOLOPredictor unavailable.")
            return

        try:
            if weights_path is None or not weights_path.exists():
                logger.warning(
                    "YOLO weights not found at %s. Predictor inactive.", weights_path
                )
                self._loaded = False
                return

            self._model = YOLO(str(weights_path))
            names = getattr(self._model, "names", None)
            if isinstance(names, dict):
                self._class_names = {int(k): str(v) for k, v in names.items()}
            elif isinstance(names, list):
                self._class_names = {idx: str(name) for idx, name in enumerate(names)}
            else:
                self._class_names = {}

            self._loaded = True
            logger.info(
                "YOLO classifier loaded from %s with classes: %s",
                weights_path,
                list(self._class_names.values()) if self._class_names else "unknown",
            )
        except ImportError:
            logger.error("ultralytics not installed. YOLOPredictor unavailable.")
            self._loaded = False
        except Exception as e:
            logger.error("Failed to load YOLO: %s", str(e))
            self._loaded = False

    def predict(self, image: Any) -> PredictionResult:
        """Run YOLO and return temple classification output."""
        if not self._loaded or self._model is None:
            raise InferenceError("YOLO weights not loaded.")

        if not hasattr(image, "convert"):
            raise InferenceError("Invalid image supplied for inference.")

        try:
            pil_image = image.convert("RGB") if image.mode != "RGB" else image.copy()
            results = self._model.predict(pil_image, verbose=False, conf=0.5)
            result = results[0]

            class_probs: dict[str, float] = {}
            predicted_class = "unknown"
            confidence = 0.0

            # Preferred path: YOLO classification head output.
            if getattr(result, "probs", None) is not None:
                probs_tensor = result.probs.data
                probs = probs_tensor.cpu().tolist()
                class_probs = {
                    self._class_names.get(idx, str(idx)): round(float(prob), 4)
                    for idx, prob in enumerate(probs)
                }
                top_idx = int(result.probs.top1)
                predicted_class = self._class_names.get(top_idx, str(top_idx))
                confidence = float(result.probs.top1conf.cpu().item())

            # Fallback path: if model returns detection boxes, aggregate scores by class.
            elif (
                getattr(result, "boxes", None) is not None
                and result.boxes is not None
                and len(result.boxes) > 0
            ):
                scores: dict[int, float] = {}
                total = 0.0
                for conf, cls_id in zip(
                    result.boxes.conf.cpu().numpy(), result.boxes.cls.cpu().numpy()
                ):
                    idx = int(cls_id)
                    score = float(conf)
                    scores[idx] = scores.get(idx, 0.0) + score
                    total += score

                if total > 0:
                    class_probs = {
                        self._class_names.get(idx, str(idx)): round(score / total, 4)
                        for idx, score in scores.items()
                    }
                    top_idx = max(scores, key=scores.get)
                    predicted_class = self._class_names.get(top_idx, str(top_idx))
                    confidence = float(class_probs[predicted_class])

            return PredictionResult(
                predicted_class=predicted_class,
                confidence=confidence,
                class_probabilities=class_probs,
                gradcam_image=None,
                detections=None,
            )
        except Exception as e:
            logger.error("YOLO inference failed: %s", str(e))
            raise InferenceError(f"Classification failed: {str(e)}")

    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def model_name(self) -> str:
        return "yolo_damage"

    @property
    def model_version(self) -> str:
        return "best.pt"
