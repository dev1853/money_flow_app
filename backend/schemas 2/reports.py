# /backend/app/schemas/reports.py

from pydantic import BaseModel, Field
from decimal import Decimal
from typing import List

# Схема для Отчета о Движении Денежных Средств (ДДС)
class DdsReportItem(BaseModel):
    article_id: int
    article_name: str
    amount: Decimal
    percentage_of_total: float = Field(..., ge=0, le=100)

# Схема для Отчета о Прибылях и Убытках (ОПиУ)
class ProfitLossReport(BaseModel):
    total_income: Decimal
    total_expense: Decimal
    net_profit: Decimal
    profit_margin: float # рентабельность

# Схема для отчета по балансам
class AccountBalance(BaseModel):
    name: str
    balance: Decimal
    currency: str