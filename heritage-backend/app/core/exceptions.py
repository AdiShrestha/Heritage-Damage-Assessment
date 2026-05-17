from __future__ import annotations

"""Application-specific exceptions."""

from typing import Optional


class AppException(Exception):
    """Base application exception with HTTP semantics."""

    def __init__(self, status_code: int, error_code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.error_code = error_code
        self.message = message


class ImageValidationError(AppException):
    def __init__(self, message: str = "Image validation failed.") -> None:
        super().__init__(status_code=422, error_code="IMAGE_VALIDATION_ERROR", message=message)


class UnsupportedImageFormatError(AppException):
    def __init__(self, message: str = "Unsupported image format.") -> None:
        super().__init__(status_code=415, error_code="UNSUPPORTED_IMAGE_FORMAT", message=message)


class FileSizeTooLargeError(AppException):
    def __init__(self, message: str = "File size too large.") -> None:
        super().__init__(status_code=413, error_code="FILE_SIZE_TOO_LARGE", message=message)


class ModelNotFoundError(AppException):
    def __init__(self, message: str = "Model not found.") -> None:
        super().__init__(status_code=404, error_code="MODEL_NOT_FOUND", message=message)


class InferenceError(AppException):
    def __init__(self, message: str = "Inference failed.") -> None:
        super().__init__(status_code=500, error_code="INFERENCE_ERROR", message=message)


class PreprocessingError(AppException):
    def __init__(self, message: str = "Preprocessing failed.") -> None:
        super().__init__(status_code=422, error_code="PREPROCESSING_ERROR", message=message)
