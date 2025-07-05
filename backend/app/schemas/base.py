# backend/app/schemas/base.py

from pydantic import BaseModel, ConfigDict

class BaseSchema(BaseModel):
    """A base schema with from_attributes enabled for ORM compatibility."""
    model_config = ConfigDict(from_attributes=True)