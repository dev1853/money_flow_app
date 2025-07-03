# /backend/app/schemas/budget.py
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import date
from decimal import Decimal

# Используем относительный импорт, чтобы избежать проблем
from .dds_article import DdsArticle

class BudgetItemBase(BaseModel):
    dds_article_id: int
    budgeted_amount: Decimal = Field(..., gt=Decimal('0.0'))

class BudgetItemCreate(BudgetItemBase):
    pass

class BudgetBase(BaseModel):
    name: str = Field(..., min_length=1)
    start_date: date
    end_date: date

class BudgetCreate(BudgetBase):
    items: List[BudgetItemCreate]

class BudgetUpdate(BudgetBase):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class BudgetItem(BudgetItemBase):
    id: int
    type: str
    model_config = ConfigDict(from_attributes=True)

class Budget(BudgetBase):
    id: int
    owner_id: int
    workspace_id: int
    items: List[BudgetItem] = []
    model_config = ConfigDict(from_attributes=True)