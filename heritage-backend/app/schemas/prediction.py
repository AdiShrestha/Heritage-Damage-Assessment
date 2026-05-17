from __future__ import annotations

"""Prediction response schemas."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field
from pydantic import ConfigDict
from typing import Annotated


class ClassProbability(BaseModel):
    class_name: str
    probability: Annotated[float, Field(ge=0.0, le=1.0)]


class Detection(BaseModel):
    """Object detection result with bounding box."""
    bbox: list[float]  # [x1, y1, x2, y2]
    confidence: Annotated[float, Field(ge=0.0, le=1.0)]
    damage_type: str
    class_id: int


class PredictionResponse(BaseModel):
    request_id: str
    model_used: str
    predicted_class: str
    confidence: Annotated[float, Field(ge=0.0, le=1.0)]
    class_probabilities: List[ClassProbability]
    gradcam_image_base64: str | None = None
    inference_time_ms: float
    image_dimensions: dict[str, int]
    detections: Optional[List[Detection]] = None  # YOLO detections
    timestamp: datetime

    model_config = ConfigDict(json_encoders={datetime: lambda v: v.isoformat()})
