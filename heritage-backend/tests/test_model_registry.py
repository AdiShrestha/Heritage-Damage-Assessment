import pytest
from app.ml.model_registry import ModelRegistry
from app.core.exceptions import ModelNotFoundError

def test_vgg16_registered():
    registry = ModelRegistry()
    assert "vgg16" in [m["name"] for m in registry.list_models()]

def test_efficientnet_registered():
    registry = ModelRegistry()
    assert "efficientnet_b4" in [m["name"] for m in registry.list_models()]

def test_unknown_model_raises_model_not_found():
    registry = ModelRegistry()
    with pytest.raises(ModelNotFoundError):
        registry.get("nonexistent_model")
