from __future__ import annotations

"""Image preprocessing pipeline producing tensors when torch is available."""

from typing import Any
import numpy as np
from PIL import Image

from app.core.exceptions import PreprocessingError
from app.utils.constants import DEFAULT_IMAGE_SIZE


IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


class PreprocessingPipeline:
    """Prepare PIL images for model input and Grad-CAM."""

    def __init__(self, image_size: tuple[int, int] = DEFAULT_IMAGE_SIZE) -> None:
        self.image_size = image_size

    def preprocess(self, image: Any) -> dict[str, Any]:
        """Preprocess a PIL.Image.Image and optionally return a torch tensor."""
        if not hasattr(image, "convert"):
            raise PreprocessingError("Invalid image type for preprocessing.")

        pil: Image.Image = image.convert("RGB") if image.mode != "RGB" else image.copy()
        original_size = (pil.width, pil.height)
        if pil.width < 32 or pil.height < 32:
            raise PreprocessingError("Image too small for processing.")

        resized = pil.resize(self.image_size, Image.Resampling.LANCZOS)
        preprocessed_pil = resized.copy()

        img_array = np.array(resized).astype(np.float32) / 255.0
        normalized = (img_array - IMAGENET_MEAN) / IMAGENET_STD

        try:
            import torch

            tensor = torch.from_numpy(normalized.transpose(2, 0, 1)).unsqueeze(0).float()
        except ImportError:
            tensor = None

        return {"original_size": original_size, "preprocessed_pil": preprocessed_pil, "tensor": tensor}
