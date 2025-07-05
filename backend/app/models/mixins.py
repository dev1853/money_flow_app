# app/models/mixins.py
from sqlalchemy import Column, DateTime
from sqlalchemy.sql import func

class TimestampMixin:
    """Миксин для добавления полей created_at и updated_at."""
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)