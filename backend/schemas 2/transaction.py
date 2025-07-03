# /backend/app/schemas/transaction.py
import enum
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import date
from decimal import Decimal

class TransactionType(str, enum.Enum):
    INCOME = "income"
    EXPENSE = "expense"

class TransactionBase(BaseModel):
    transaction_date: date
    amount: Decimal = Field(..., gt=Decimal('0.0'))
    description: Optional[str] = None
    transaction_type: TransactionType
    account_id: int
    dds_article_id: Optional[int] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    transaction_date: Optional[date] = None
    amount: Optional[Decimal] = Field(None, gt=Decimal('0.0'))
    description: Optional[str] = None
    account_id: Optional[int] = None
    dds_article_id: Optional[int] = None

class Transaction(TransactionBase):
    id: int
    created_by_user_id: int
    workspace_id: int
    model_config = ConfigDict(from_attributes=True)