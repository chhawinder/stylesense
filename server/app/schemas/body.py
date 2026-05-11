from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class BodyScanResult(BaseModel):
    body_shape: str
    chest_cm: Optional[float] = None
    waist_cm: Optional[float] = None
    hip_cm: Optional[float] = None
    shoulder_cm: Optional[float] = None
    height_cm: Optional[float] = None
    predicted_size: Optional[str] = None
    skin_tone_fitzpatrick: Optional[int] = None
    skin_undertone: Optional[str] = None
    color_season: Optional[str] = None
    face_shape: Optional[str] = None
    gender: Optional[str] = None


class BodyProfileResponse(BaseModel):
    id: str
    body_shape: str
    chest_cm: Optional[float]
    waist_cm: Optional[float]
    hip_cm: Optional[float]
    shoulder_cm: Optional[float]
    height_cm: Optional[float]
    predicted_size: Optional[str]
    skin_tone_fitzpatrick: Optional[int]
    skin_undertone: Optional[str]
    color_season: Optional[str]
    face_shape: Optional[str]
    gender: Optional[str]

    class Config:
        from_attributes = True
