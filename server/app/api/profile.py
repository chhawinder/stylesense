from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.body_profile import BodyProfile
from app.models.user import User
from app.schemas.body import BodyScanResult, BodyProfileResponse
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.post("/body", response_model=BodyProfileResponse)
async def save_body_profile(scan: BodyScanResult, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Save body scan results from client-side MediaPipe analysis."""
    user_id = user.id

    # Deactivate previous profiles
    db.query(BodyProfile).filter(
        BodyProfile.user_id == user_id, BodyProfile.is_active == True
    ).update({"is_active": False})

    profile = BodyProfile(user_id=user_id, **scan.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/body", response_model=Optional[BodyProfileResponse])
async def get_body_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get the active body profile for the current user."""
    profile = (
        db.query(BodyProfile)
        .filter(BodyProfile.user_id == user.id, BodyProfile.is_active == True)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="No body profile found. Please complete a scan first.")
    return profile


@router.delete("/body/{profile_id}")
async def delete_body_profile(profile_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a body profile (DPDP Act compliance — right to erasure)."""
    profile = db.query(BodyProfile).filter(BodyProfile.id == profile_id, BodyProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    db.delete(profile)
    db.commit()
    return {"message": "Body profile deleted successfully"}
