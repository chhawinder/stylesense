import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, ForeignKey, JSON

from app.db.database import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), index=True)
    body_profile_id = Column(String, ForeignKey("body_profiles.id"))
    occasion = Column(String)
    llm_response = Column(JSON)
    products = Column(JSON)  # matched product IDs + scores
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class ClickEvent(Base):
    __tablename__ = "click_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    product_id = Column(String, ForeignKey("products.id"))
    recommendation_id = Column(String, ForeignKey("recommendations.id"))
    event_type = Column(String)  # view, click, purchase
    clicked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
