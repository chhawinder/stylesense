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

    is_active = Column(Boolean, default=True)
    scanned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
