# /backend/app/schemas/workspace.py
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class WorkspaceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None

class WorkspaceCreate(WorkspaceBase):
    pass

class WorkspaceUpdate(WorkspaceBase):
    pass

class Workspace(WorkspaceBase):
    id: int
    owner_id: int
    model_config = ConfigDict(from_attributes=True)