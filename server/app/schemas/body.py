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
    color_season_12: Optional[str] = None
    face_shape: Optional[str] = None
    gender: Optional[str] = None
    torso_leg_ratio: Optional[float] = None
    torso_leg_type: Optional[str] = None
    arm_length: Optional[str] = None
    kibbe_type: Optional[str] = None
    posture: Optional[str] = None
    posture_forward_head_deg: Optional[float] = None
    hair_skin_contrast: Optional[str] = None
    eye_spacing: Optional[str] = None
    nose_bridge: Optional[str] = None
    glasses_recommendation: Optional[str] = None


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
    color_season_12: Optional[str]
    face_shape: Optional[str]
    gender: Optional[str]
    torso_leg_ratio: Optional[float]
    torso_leg_type: Optional[str]
    arm_length: Optional[str]
    kibbe_type: Optional[str]
    posture: Optional[str]
    posture_forward_head_deg: Optional[float]
    hair_skin_contrast: Optional[str]
    eye_spacing: Optional[str]
    nose_bridge: Optional[str]
    glasses_recommendation: Optional[str]

    class Config:
        from_attributes = True
