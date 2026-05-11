import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    google_id = Column(String, unique=True, index=True)
    name = Column(String)
    avatar = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
