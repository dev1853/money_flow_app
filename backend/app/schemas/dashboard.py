# /backend/app/schemas/dashboard.py

from pydantic import BaseModel, Field
from decimal import Decimal
from typing import List
from datetime import date

# --- СХЕМА, КОТОРАЯ ВЫЗЫВАЛА ОШИБКУ ---
class DashboardSummaryData(BaseModel):
    """Сводные данные для дашборда."""
    total_income: Decimal
    total_expense: Decimal
    net_cash_flow: Decimal

class DashboardCashflowTrendData(BaseModel):
    """Данные для графика движения денежных потоков."""
    period: date
    income: Decimal
    expense: Decimal