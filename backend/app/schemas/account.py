# /backend/app/schemas/account.py

from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal

# Базовая схема, содержащая общие поля
class AccountBase(BaseModel):
    name: str
    balance: Decimal = Field(default=Decimal('0.0'))
    currency: Optional[str] = 'RUB'
    
    class Config:
        from_attributes = True

# Схема для создания Счета
class AccountCreate(AccountBase):
    workspace_id: int
    # ДОБАВЛЕНО: Теперь схема ожидает это поле
    account_type: str 

# Схема для обновления Счета
class AccountUpdate(AccountBase):
    name: Optional[str] = None
    balance: Optional[Decimal] = None
    currency: Optional[str] = None
    account_type: Optional[str] = None

# Основная схема для чтения данных из БД
class Account(AccountBase):
    id: int
    owner_id: int
    workspace_id: int
    account_type: str