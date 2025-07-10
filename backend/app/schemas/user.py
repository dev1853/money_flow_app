# schemas/user.py
from __future__ import annotations # Важно для отложенных ссылок

from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field

from .base import BaseSchema

class UserBase(BaseSchema):
    email: EmailStr
    username: str
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
    role_id: Optional[int] = None
    active_workspace_id: Optional[int] = None

class User(UserInDB):
    pass

class UserWithRole(User):
    role: Optional["Role"] = None # Отложенная ссылка

class UserWithWorkspace(User):
    active_workspace: Optional["Workspace"] = None # Отложенная ссылка
    workspaces: List["Workspace"] = [] # Отложенная ссылка

class UserUpdate(BaseModel):
    password: Optional[str] = None
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    full_name: Optional[str] = None