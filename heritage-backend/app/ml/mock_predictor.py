from __future__ import annotations

"""Mock predictor implementation with fake Grad-CAM and probabilities."""

import io
import random
import time
from typing import Any

import numpy as np
from PIL import Image, ImageDraw

from app.ml.base_predictor import BasePredictor, PredictionResult
from app.utils.constants import CLASS_NAMES, DEFAULT_IMAGE_SIZE
from app.core.logging import get_logger

logger = get_logger(__name__)


class MockPredictor(BasePredictor):
    """A lightweight predictor that simulates inference without ML libs."""

    def __init__(self) -> None:
        self._loaded = False

    def load_model(self, weights_path: Path | None = None) -> None:  # type: ignore[name-defined]
        """Mock load - no weights required."""
        self._loaded = True
        logger.info("MockPredictor loaded (no weights needed)")

    def is_loaded(self) -> bool:
        """Return True always after load_model called."""
        return self._loaded

    @property
    def model_name(self) -> str:
        return "mock"

    @property
    def model_version(self) -> str:
        return "1.0.0"

    def predict(self, image: Any) -> PredictionResult:
        """Simulate prediction with random probabilities and a fake Grad-CAM."""
        time.sleep(random.uniform(0.05, 0.15))

        # Build raw scores
        weights = [0.4, 0.3, 0.3]
        winner = int(np.random.choice(len(weights), p=np.array(weights) / sum(weights)))
        raw = []
        for i in range(len(CLASS_NAMES)):
            if i == winner:
                raw.append(random.uniform(3.0, 6.0))
            else:
                raw.append(random.uniform(0.1, 1.5))
        exp = np.exp(np.array(raw))
        probs = (exp / exp.sum()).round(4).tolist()

        class_probs = {name: float(p) for name, p in zip(CLASS_NAMES, probs)}
        pred_idx = int(np.argmax(probs))

        # Create fake gradcam overlay
        pil = image.convert("RGBA") if hasattr(image, "convert") else Image.new("RGBA", DEFAULT_IMAGE_SIZE)
        resized = pil.resize(DEFAULT_IMAGE_SIZE)
        overlay = Image.new("RGBA", resized.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        w, h = resized.size
        for _ in range(random.randint(3, 5)):
            cx = int(random.gauss(w / 2, w / 6))
            cy = int(random.gauss(h / 2, h / 6))
            rx = random.randint(int(w * 0.05), int(w * 0.25))
            ry = random.randint(int(h * 0.05), int(h * 0.25))
            bbox = [cx - rx, cy - ry, cx + rx, cy + ry]
            color = random.choice([(255, 0, 0, 120), (255, 165, 0, 110), (255, 255, 0, 100)])
            draw.ellipse(bbox, fill=color)
        composited = Image.alpha_composite(resized.convert("RGBA"), overlay).convert("RGB")

        return PredictionResult(
            predicted_class=CLASS_NAMES[pred_idx],
            confidence=float(probs[pred_idx]),
            class_probabilities=class_probs,
            gradcam_image=composited,
        )
