# schemas/user.py
from __future__ import annotations # Важно для отложенных ссылок

from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field

# Мы предполагаем, что у вас есть BaseSchema, от которого наследуются другие.
# Если нет, замените 'BaseSchema' на 'BaseModel'.
from .base import BaseSchema

class UserBase(BaseSchema):
    email: EmailStr
    username: str
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    # --- ВОТ ИСПРАВЛЕНИЕ ---
    # Добавляем это поле. Оно не требуется от пользователя при регистрации,
    # но позволяет нашему коду присвоить его внутри сервиса.
    role_id: Optional[int] = None

class UserInDB(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
    role_id: Optional[int] = None
    active_workspace_id: Optional[int] = None

class User(UserInDB):
    pass

class UserWithRole(User):
    role: Optional["Role"] = None

class UserWithWorkspace(User):
    active_workspace: Optional["Workspace"] = None
    workspaces: List["Workspace"] = []

class UserUpdate(BaseModel):
    password: Optional[str] = None
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    full_name: Optional[str] = None