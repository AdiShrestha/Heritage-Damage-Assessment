from __future__ import annotations

"""Application configuration using pydantic-settings."""

from pathlib import Path
from typing import Literal

from pydantic import field_validator, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Settings loaded from environment and .env file."""

    model_config = SettingsConfigDict(
        env_file=".env", case_sensitive=True, extra="ignore"
    )

    APP_NAME: str = "Heritage Damage Assessment API"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = (
        "Deep learning-based cultural heritage damage classification."
    )
    DEBUG: bool = False
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    API_V1_PREFIX: str = "/api/v1"
    ALLOWED_ORIGINS: str = "*"
    TORCH_DEVICE: str = "cuda"
    MAX_IMAGE_SIZE_MB: float = 10.0
    DEFAULT_MODEL: str = "mock"
    ENABLED_MODELS: str = "mock,resnet50,efficientnet_b4,vit_b16"
    MODEL_WEIGHTS_DIR: Path = Path("weights/")
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: Literal["json", "text"] = "json"
    REQUEST_TIMEOUT_SECONDS: float = 30.0

    @property
    def allowed_origins_list(self) -> list[str]:
        """Parse comma-separated origins into a list."""
        if self.ALLOWED_ORIGINS == "*":
            return ["*"]
        return [s.strip() for s in self.ALLOWED_ORIGINS.split(",") if s.strip()]

    @property
    def enabled_models_list(self) -> list[str]:
        """Parse comma-separated model names into a normalized list."""
        return [s.strip().lower() for s in self.ENABLED_MODELS.split(",") if s.strip()]


# Cached settings instance
settings = Settings()
