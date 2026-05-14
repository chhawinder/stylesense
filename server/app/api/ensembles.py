from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.api.auth import get_current_user
from app.schemas.ensemble import EnsembleRequest, EnsembleResponse
from app.services.ensemble_service import generate_ensembles

router = APIRouter(prefix="/api/ensembles", tags=["ensembles"])


@router.post("", response_model=EnsembleResponse)
async def get_ensembles(req: EnsembleRequest, user: User = Depends(get_current_user)):
    """Generate 3 personalized outfit ensembles based on body profile."""
    result = await generate_ensembles(
        body_shape=req.body_shape or "rectangle",
        skin_undertone=req.skin_undertone or "warm",
        color_season=req.color_season or "autumn",
        face_shape=req.face_shape or "oval",
        gender=req.gender or "female",
        predicted_size=req.predicted_size or "M",
        kibbe_type=req.kibbe_type or "classic",
        height_cm=req.height_cm or 165,
        occasion=req.occasion or "casual",
        budget_min=req.budget_min,
        budget_max=req.budget_max,
    )
    return result
