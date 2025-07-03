# /backend/app/schemas/account.py

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from decimal import Decimal

class AccountBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    currency: str = Field("RUB", min_length=3, max_length=3)
    balance: Decimal = Field(Decimal('0.0'), ge=Decimal('0.0'))
    is_active: bool = True
    workspace_id: int

class AccountCreate(AccountBase):
    pass

class AccountUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    is_active: Optional[bool] = None

class Account(AccountBase):
    id: int
    owner_id: int
    model_config = ConfigDict(from_attributes=True)