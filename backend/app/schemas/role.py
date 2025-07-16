# backend/app/schemas/role.py

from pydantic import BaseModel, ConfigDict
from typing import Optional # <-- 1. Импортируем Optional

# --- Базовая схема Role ---
class RoleBase(BaseModel):
    name: str
    # 2. Используем Optional[str] вместо str | None
    description: Optional[str] = None


# --- Схема для создания Role ---
class RoleCreate(RoleBase):
    id: int


# --- Схема для обновления Role ---
class RoleUpdate(BaseModel):
    # 2. Используем Optional[str] вместо str | None
    name: Optional[str] = None
    description: Optional[str] = None


# --- Схема для чтения Role ---
class Role(RoleBase):
    id: int

    model_config = ConfigDict(from_attributes=True)