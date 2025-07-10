
from __future__ import annotations 
from typing import List
from datetime import date
from decimal import Decimal

from pydantic import BaseModel

class SummaryItem(BaseModel):
    currency: str
    total_income: Decimal
    total_expense: Decimal
    net_balance: Decimal

class DashboardSummaryData(BaseModel):
    start_date: date
    end_date: date
    summary_by_currency: List[SummaryItem]

class DashboardCashflowTrendData(BaseModel):
    period: str
    currency: str
    income: Decimal # ИСПРАВЛЕНО: Изменено с total_income на income
    expense: Decimal # ИСПРАВЛЕНО: Изменено с total_expense на expense
    net_balance: Decimal