from __future__ import annotations

from typing import Optional, List

from pydantic import BaseModel


class RecommendationRequest(BaseModel):
    body_shape: Optional[str] = None
    skin_undertone: Optional[str] = None
    color_season: Optional[str] = None
    face_shape: Optional[str] = None
    gender: Optional[str] = "female"
    predicted_size: Optional[str] = "M"
    occasion: Optional[str] = None
    budget_min: int = 500
    budget_max: int = 10000
    platforms: Optional[List[str]] = None
    # Pagination: page 0 = initial load (generates queries), page 1+ = load more
    page: int = 0
    # Remaining queries from page 0 response, sent back for page 1+
    pending_queries: Optional[List[dict]] = None
