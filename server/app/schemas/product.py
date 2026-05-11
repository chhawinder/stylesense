from __future__ import annotations

from typing import Optional, List

from pydantic import BaseModel


class ProductResponse(BaseModel):
    id: str
    source: str
    title: str
    description: Optional[str]
    price: Optional[float]
    image_urls: list
    category: Optional[str]
    colors: list
    sizes: list
    brand: Optional[str]
    rating: Optional[float]
    affiliate_url: Optional[str]

    class Config:
        from_attributes = True
