from __future__ import annotations

from typing import Optional, List

from pydantic import BaseModel


class RecommendationRequest(BaseModel):
    occasion: Optional[str] = None
    budget_min: int = 500
    budget_max: int = 10000


class RecommendationResponse(BaseModel):
    id: str
    occasion: Optional[str]
    llm_response: Optional[dict]
    products: Optional[list]

    class Config:
        from_attributes = True
