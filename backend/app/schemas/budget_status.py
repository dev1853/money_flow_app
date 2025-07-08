# /backend/app/schemas/budget_status.py

from pydantic import BaseModel, computed_field
from typing import List
from datetime import date
from decimal import Decimal

# Схемы для страницы статуса бюджета
class BudgetItemStatus(BaseModel):
    article_id: int
    article_name: str
    budgeted_amount: Decimal
    actual_amount: Decimal
    
    @computed_field
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
    
    @computed_field
    @property
    def total_deviation(self) -> Decimal:
        return self.total_budgeted - self.total_actual