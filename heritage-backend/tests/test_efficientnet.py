import pytest
from unittest.mock import MagicMock
from pathlib import Path
from PIL import Image
import numpy as np

from app.ml.efficientnet_predictor import EfficientNetPredictor
from app.core.exceptions import InferenceError

class TestEfficientNetPredictor:
    def test_load_model_missing_weights_does_not_raise(self):
        predictor = EfficientNetPredictor()
        predictor.load_model(Path("nonexistent.pth"))
        assert not predictor.is_loaded()

    def test_predict_raises_when_not_loaded(self):
        predictor = EfficientNetPredictor()
        img = Image.new("RGB", (224, 224))
        with pytest.raises(InferenceError):
            predictor.predict(img)

    def test_model_properties(self):
        predictor = EfficientNetPredictor()
        assert predictor.model_name == "efficientnet_b4"
        assert predictor.model_version == "1.0.0"
