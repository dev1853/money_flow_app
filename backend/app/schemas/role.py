# schemas/role.py
from __future__ import annotations # Важно для отложенных ссылок

from typing import List, Optional
from pydantic import BaseModel

from .base import BaseSchema

class RoleBase(BaseSchema):
    name: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class RoleInDB(RoleBase):
    id: int

class Role(RoleInDB):
    users: List["User"] = [] # Отложенная ссылка

# УДАЛИТЕ все вызовы model_rebuild() отсюда. Они будут в __init__.py
# Role.model_rebuild()