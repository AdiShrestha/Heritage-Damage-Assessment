from __future__ import annotations

"""Stateless image I/O and validation service."""

from typing import Any
from pathlib import Path

from fastapi import UploadFile

from PIL import Image, UnidentifiedImageError

from app.core.config import settings
from app.core.exceptions import (
    ImageValidationError,
    UnsupportedImageFormatError,
    FileSizeTooLargeError,
)

from app.utils.constants import ALLOWED_MIME_TYPES


class ImageService:
    """Stateless image I/O and validation service."""

    @staticmethod
    async def validate_upload(file: UploadFile) -> None:
        if file.content_type not in ALLOWED_MIME_TYPES:
            raise UnsupportedImageFormatError(
                message=f"Content type '{file.content_type}' is not supported. Allowed: {ALLOWED_MIME_TYPES}"
            )
        contents = await file.read()
        await file.seek(0)
        max_bytes = int(settings.MAX_IMAGE_SIZE_MB * 1024 * 1024)
        if len(contents) > max_bytes:
            raise FileSizeTooLargeError(
                message=f"File size {len(contents)} bytes exceeds limit of {int(max_bytes)} bytes."
            )

    @staticmethod
    async def read_as_pil(file: UploadFile) -> Any:
        import io

        contents = await file.read()
        await file.seek(0)
        try:
            image = Image.open(io.BytesIO(contents))
            image.verify()
            image = Image.open(io.BytesIO(contents))
            return image
        except UnidentifiedImageError:
            raise ImageValidationError(message="Cannot identify image file. File may be corrupted.")
        except Exception as e:
            raise ImageValidationError(message=f"Failed to read image: {str(e)}")

    @staticmethod
    def pil_to_base64(image: Any, fmt: str = "JPEG") -> str:
        import io, base64

        buffer = io.BytesIO()
        image.save(buffer, format=fmt, quality=85)
        return base64.b64encode(buffer.getvalue()).decode("utf-8")

    @staticmethod
    def get_dimensions(image: Any) -> dict[str, int]:
        return {"width": image.width, "height": image.height}
