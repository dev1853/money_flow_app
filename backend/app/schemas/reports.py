# backend/app/schemas/reports.py

from __future__ import annotations 
from pydantic import BaseModel
from decimal import Decimal
from typing import List

class DdsReportItem(BaseModel):
    article_id: int
    article_name: str
    article_type: str
    initial_balance: Decimal
    turnover: Decimal
    final_balance: Decimal
    amount: Decimal
    percentage_of_total: Decimal

class DdsReport(BaseModel):
    items: List[DdsReportItem]
    total_initial_balance: Decimal
    total_turnover: Decimal
    total_final_balance: Decimal

class ProfitLossReport(BaseModel):
    total_income: Decimal
    total_expense: Decimal
    net_profit: Decimal