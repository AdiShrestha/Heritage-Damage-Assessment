from __future__ import annotations

"""Image helper utilities."""

from typing import Any

from PIL import Image


def ensure_rgb(image: Any) -> Image.Image:
    """Return an RGB copy of the image."""
    if not isinstance(image, Image.Image):
        raise TypeError("Expected PIL.Image.Image")
    if image.mode != "RGB":
        return image.convert("RGB")
    return image.copy()
