# /backend/app/schemas/user.py
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional

# Мы импортируем только то, что нужно здесь.
from .account import Account

class UserBase(BaseModel):
    email: EmailStr
    username: str
    is_active: bool = True
    is_superuser: bool = False
    full_name: Optional[str] = None
    active_workspace_id: Optional[int] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    role_id: int = 2

class UserUpdate(BaseModel):
    password: Optional[str] = None
    email: Optional[EmailStr] = None
    username: Optional[str] = None

class User(UserBase):
    id: int
    # accounts: List[Account] = [] # Можно раскомментировать, если нужно возвращать счета вместе с пользователем
    model_config = ConfigDict(from_attributes=True)