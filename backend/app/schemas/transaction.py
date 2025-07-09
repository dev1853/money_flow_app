# /backend/app/schemas/transaction.py

import enum
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import date
from decimal import Decimal

# Этот Enum остается без изменений
class TransactionType(str, enum.Enum):
    INCOME = "INCOME"
    EXPENSE = "EXPENSE"
    TRANSFER = "TRANSFER"

# --- ОБНОВЛЕННАЯ БАЗОВАЯ СХЕМА ---
# Используется для валидации данных, приходящих из API
class TransactionBase(BaseModel):
    transaction_date: date
    amount: Decimal = Field(..., gt=Decimal('0.0'), description="Сумма транзакции, всегда положительная")
    description: Optional[str] = None
    transaction_type: TransactionType
    
    # Заменяем неоднозначный account_id на явные поля
    from_account_id: Optional[int] = None
    to_account_id: Optional[int] = None
    
    dds_article_id: Optional[int] = None
    counterparty_id: Optional[int] = None

# --- ОБНОВЛЕННАЯ СХЕМА ДЛЯ СОЗДАНИЯ ---
# Она наследуется от базовой и может добавлять свои поля, если нужно
class TransactionCreate(TransactionBase):
    pass

# --- ОБНОВЛЕННАЯ СХЕМА ДЛЯ ОБНОВЛЕНИЯ ---
# Все поля опциональны
class TransactionUpdate(BaseModel):
    transaction_date: Optional[date] = None
    amount: Optional[Decimal] = Field(None, gt=Decimal('0.0'))
    description: Optional[str] = None
    from_account_id: Optional[int] = None
    to_account_id: Optional[int] = None
    dds_article_id: Optional[int] = None

# --- ОБНОВЛЕННАЯ СХЕМА ДЛЯ ОТВЕТА API ---
# Эта схема используется в response_model и должна ТОЧНО соответствовать
# полям SQLAlchemy модели, которые мы хотим вернуть.
class Transaction(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    transaction_date: date
    amount: Decimal
    description: Optional[str]
    transaction_type: TransactionType
    
    # Явные поля, которые есть в модели SQLAlchemy
    from_account_id: Optional[int] = None 
    to_account_id: Optional[int] = None
    dds_article_id: Optional[int]
    
    user_id: int
    workspace_id: int

# --- СХЕМА ДЛЯ ПАГИНАЦИИ, ИСПОЛЬЗУЕТ ОБНОВЛЕННУЮ СХЕМУ Transaction ---
class TransactionPage(BaseModel):
    transactions: List[Transaction]
    total_count: int