import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey

from app.db.database import Base


class BodyProfile(Base):
    __tablename__ = "body_profiles"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    body_shape = Column(String, nullable=False)  # hourglass, pear, apple, rectangle, inverted_triangle
    chest_cm = Column(Float)
    waist_cm = Column(Float)
    hip_cm = Column(Float)
    shoulder_cm = Column(Float)
    height_cm = Column(Float)
    predicted_size = Column(String)  # XS, S, M, L, XL, XXL

    skin_tone_fitzpatrick = Column(Integer)  # 1-6
    skin_undertone = Column(String)  # warm, cool, neutral
    color_season = Column(String)  # spring, summer, autumn, winter

    face_shape = Column(String)  # oval, round, square, heart, oblong, diamond
    gender = Column(String)

    # Enhanced analysis fields
    color_season_12 = Column(String)  # 12-season color e.g. bright_spring, deep_autumn
    torso_leg_ratio = Column(Float)
    torso_leg_type = Column(String)  # long_torso, long_legs, balanced
    arm_length = Column(String)  # long, short, average
    kibbe_type = Column(String)  # dramatic, natural, classic, gamine, romantic
    posture = Column(String)  # normal, slight_forward, forward_head
    posture_forward_head_deg = Column(Float)
    hair_skin_contrast = Column(String)  # high, medium, low
    eye_spacing = Column(String)  # wide, close, average
    nose_bridge = Column(String)  # wide, narrow, medium
    glasses_recommendation = Column(String)

    is_active = Column(Boolean, default=True)
    scanned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
