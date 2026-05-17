from __future__ import annotations

"""Module-level constants used across the app."""

CLASS_NAMES: list[str] = ["Undamaged", "Partial Damage", "Damaged"]
NUM_CLASSES: int = 3
DEFAULT_IMAGE_SIZE: tuple[int, int] = (224, 224)
IMAGENET_MEAN: list[float] = [0.485, 0.456, 0.406]
IMAGENET_STD: list[float] = [0.229, 0.224, 0.225]
ALLOWED_EXTENSIONS: set[str] = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES: set[str] = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_BYTES: int = 10 * 1024 * 1024  # 10MB
MIN_IMAGE_DIMENSION: int = 32
