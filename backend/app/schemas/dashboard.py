# /backend/app/schemas/dashboard.py

from pydantic import BaseModel, Field
from decimal import Decimal
from typing import List
from datetime import date
from .base import BaseSchema 

# --- СХЕМА, КОТОРАЯ ВЫЗЫВАЛА ОШИБКУ ---
class DashboardSummaryData(BaseSchema):
    """Сводные данные для дашборда."""
    total_income: Decimal
    total_expense: Decimal
    net_cash_flow: Decimal

class DashboardCashflowTrendData(BaseSchema):
    """Данные для графика движения денежных потоков."""
    period: date
    income: Decimal
    expense: Decimal