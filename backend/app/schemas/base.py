# backend/app/schemas/base.py

from __future__ import annotations 
from pydantic import BaseModel, ConfigDict

class BaseSchema(BaseModel):
    """A base schema with from_attributes enabled for ORM compatibility."""
    model_config = ConfigDict(from_attributes=True)