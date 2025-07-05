# backend/app/schemas/account_type.py

from pydantic import BaseModel
from typing import Optional

class AccountTypeBase(BaseModel):
    name: str
    code: str

    class Config:
        from_attributes = True

class AccountTypeCreate(AccountTypeBase):
    pass

class AccountTypeUpdate(AccountTypeBase):
    name: Optional[str] = None
    code: Optional[str] = None

class AccountType(AccountTypeBase):
    id: int