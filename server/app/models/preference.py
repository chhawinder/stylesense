import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON

from app.db.database import Base


class StylePreference(Base):
    __tablename__ = "style_preferences"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    occasions = Column(JSON, default=list)  # ["casual", "wedding", "office"]
    preferred_styles = Column(JSON, default=list)  # ["ethnic", "western", "fusion"]
    budget_min = Column(Integer, default=500)
    budget_max = Column(Integer, default=5000)
    avoid_colors = Column(JSON, default=list)
    brand_preferences = Column(JSON, default=list)
    preferred_platforms = Column(JSON, default=list)  # ["amazon", "myntra"]

    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
