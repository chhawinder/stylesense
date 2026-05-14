from __future__ import annotations

from typing import Optional, List

from pydantic import BaseModel


class EnsembleItem(BaseModel):
    category: str
    style_notes: str
    color: str = ""
    products: List[dict] = []


class Ensemble(BaseModel):
    name: str
    style_score: int
    description: str
    occasion: str = "casual"
    total_price: Optional[int] = None
    mannequin_image: str = ""
    items: List[EnsembleItem] = []


class EnsembleRequest(BaseModel):
    body_shape: Optional[str] = None
    skin_undertone: Optional[str] = None
    color_season: Optional[str] = None
    face_shape: Optional[str] = None
    gender: Optional[str] = "female"
    predicted_size: Optional[str] = "M"
    kibbe_type: Optional[str] = None
    height_cm: Optional[float] = None
    occasion: Optional[str] = "casual"
    budget_min: int = 500
    budget_max: int = 10000


class EnsembleResponse(BaseModel):
    ensembles: List[Ensemble]
    style_rules: Optional[dict] = None
    source: str = "gemini"
