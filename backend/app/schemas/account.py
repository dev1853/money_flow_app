# /backend/app/schemas/account.py

from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
import datetime

from .base import BaseSchema

# Импортируем схему AccountType, которая будет вложена
from .account_type import AccountType as AccountTypeSchema 

# Базовая схема, содержащая общие поля

# Эта схема будет использоваться в 'response_model'
class Account(BaseSchema):
    id: int
    name: str
    balance: Decimal
    currency: str
    is_active: bool
    workspace_id: int
    account_type_id: int
    
class AccountBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    balance: Decimal = Field(Decimal('0.0'), decimal_places=2)
    currency: str = Field("RUB", min_length=3, max_length=3)
    is_active: bool = True
    account_type_id: int 

    class Config:
        from_attributes = True

# Схема для создания Счета
class AccountCreate(AccountBase):
    workspace_id: int
    pass

# Схема для обновления Счета
class AccountUpdate(AccountBase):
    name: Optional[str] = None
    balance: Optional[Decimal] = None
    currency: Optional[str] = None
    is_active: Optional[bool] = None
    account_type_id: Optional[int] = None 

# Схема для чтения данных из БД, включая связанный объект AccountType
class AccountInDBBase(AccountBase):
    id: int
    owner_id: int
    workspace_id: int
    account_type_ref: AccountTypeSchema

    created_at: datetime.datetime 
    updated_at: datetime.datetime

    class Config:
        from_attributes = True 
class Account(AccountInDBBase):
    pass