from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("/search")
async def search_products(q: str = "", category: str = "", db: Session = Depends(get_db)):
    """Search product catalog."""
    # TODO: implement vector similarity search
    return {"query": q, "category": category, "results": []}


@router.post("/click")
async def track_click(product_id: str, recommendation_id: str = "", db: Session = Depends(get_db)):
    """Track affiliate click for analytics."""
    # TODO: store click event
    return {"tracked": True}
