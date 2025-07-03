# /backend/app/schemas/budget.py

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import date
from decimal import Decimal

from .dds_article import DdsArticle

# --- Существующие схемы ---
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

class BudgetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
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

# --- СХЕМЫ, КОТОРЫЕ ВЫЗВАЛИ ОШИБКУ ---
class BudgetItemStatus(BaseModel):
    article_id: int
    article_name: str
    budgeted_amount: Decimal
    actual_amount: Decimal
    
    @property
    def deviation(self) -> Decimal:
        return self.budgeted_amount - self.actual_amount

class BudgetStatus(BaseModel):
    budget_id: int
    budget_name: str
    start_date: date
    end_date: date
    total_budgeted: Decimal
    total_actual: Decimal
    items_status: List[BudgetItemStatus]
    
    @property
    def total_deviation(self) -> Decimal:
        return self.total_budgeted - self.total_actual