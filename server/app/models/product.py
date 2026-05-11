import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, JSON

from app.db.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    source = Column(String, nullable=False)  # myntra, meesho, flipkart, amazon
    source_id = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String)
    price = Column(Float)
    currency = Column(String, default="INR")
    image_urls = Column(JSON, default=list)
    category = Column(String)  # top, bottom, dress, saree, kurta
    colors = Column(JSON, default=list)
    sizes = Column(JSON, default=list)
    brand = Column(String)
    rating = Column(Float)
    review_count = Column(Integer)
    affiliate_url = Column(String)

    scraped_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True)
