from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.body_profile import BodyProfile
from app.schemas.body import BodyScanResult, BodyProfileResponse

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.post("/body", response_model=BodyProfileResponse)
async def save_body_profile(scan: BodyScanResult, db: Session = Depends(get_db)):
    """Save body scan results from client-side MediaPipe analysis."""
    # TODO: get user_id from auth
    user_id = "demo-user"

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
async def get_body_profile(db: Session = Depends(get_db)):
    """Get the active body profile for the current user."""
    user_id = "demo-user"
    profile = (
        db.query(BodyProfile)
        .filter(BodyProfile.user_id == user_id, BodyProfile.is_active == True)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="No body profile found. Please complete a scan first.")
    return profile


@router.delete("/body/{profile_id}")
async def delete_body_profile(profile_id: str, db: Session = Depends(get_db)):
    """Delete a body profile (DPDP Act compliance — right to erasure)."""
    profile = db.query(BodyProfile).filter(BodyProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    db.delete(profile)
    db.commit()
    return {"message": "Body profile deleted successfully"}
