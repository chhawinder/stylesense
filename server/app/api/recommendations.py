from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from app.services.fashion_rules import get_style_rules

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.post("", response_model=RecommendationResponse)
async def generate_recommendations(req: RecommendationRequest, db: Session = Depends(get_db)):
    """Generate AI-powered fashion recommendations based on user profile."""
    # TODO: integrate LLM service + product matching
    # For MVP, return rule-based suggestions
    rules = get_style_rules("hourglass", "warm", "oval")

    return RecommendationResponse(
        id="demo-rec-1",
        occasion=req.occasion,
        llm_response={"suggestions": rules["best_styles"], "colors": rules["best_colors"]},
        products=[],
    )


@router.get("")
async def list_recommendations(db: Session = Depends(get_db)):
    """List past recommendations for the current user."""
    # TODO: query from DB
    return []


@router.get("/rules")
async def get_fashion_rules():
    """Return fashion domain rules for client-side preview."""
    from app.services.fashion_rules import BODY_SHAPE_RULES, SKIN_TONE_PALETTES

    return {"body_shapes": BODY_SHAPE_RULES, "skin_tones": SKIN_TONE_PALETTES}
