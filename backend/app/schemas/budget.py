# /backend/app/schemas/budget.py

from __future__ import annotations 
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import date
from decimal import Decimal

# Импортируем базовую схему для статьи
from .dds_article import DdsArticleBase

# Схема для вложенной статьи в ответе API
class DdsArticleInBudget(DdsArticleBase):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)

# --- Схемы для Статей Бюджета (BudgetItem) ---
class BudgetItemBase(BaseModel):
    dds_article_id: int = Field(..., description="ID статьи ДДС")
    budgeted_amount: Decimal = Field(..., gt=0, description="Запланированная сумма")

class BudgetItemCreate(BudgetItemBase):
    pass

class BudgetItemUpdate(BudgetItemBase):
    dds_article_id: Optional[int] = Field(None)
    budgeted_amount: Optional[Decimal] = Field(None, gt=0)

# Схема BudgetItem для ответа API
class BudgetItem(BudgetItemBase):
    id: int
    budget_id: int
    dds_article: DdsArticleInBudget # <-- Это поле решает проблему "Статья не найдена"
    model_config = ConfigDict(from_attributes=True)

# --- Схемы для Бюджета (Budget) ---
class BudgetBase(BaseModel):
    name: str
    start_date: date = Field(..., description="Дата начала бюджета (ГГГГ-ММ-ДД)")
    end_date: date  = Field(..., description="Дата окончания бюджета (ГГГГ-ММ-ДД)")

class BudgetCreate(BudgetBase):
    workspace_id: int = Field(..., description="ID рабочего пространства")  
    items: List[BudgetItemCreate] = Field(..., description="Список статей бюджета")

class BudgetUpdate(BudgetBase):
    name: Optional[str] = Field(None)
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    items: Optional[List[BudgetItemUpdate]] = None

# Финальная схема Budget для ответа API
class Budget(BudgetBase):
    id: int
    owner_id: int
    workspace_id: int
    budget_items: List[BudgetItem] = []
    total_budgeted: Optional[Decimal] = None
    total_actual: Optional[Decimal] = None
    total_deviation: Optional[Decimal] = None
    model_config = ConfigDict(from_attributes=True)