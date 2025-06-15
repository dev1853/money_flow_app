# backend/app/crud_dashboard.py

from __future__ import annotations
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal
from typing import Dict, List
from datetime import date, timedelta

from .. import models, schemas # Схемы импортируются здесь

def get_kpis(db: Session, workspace_id: int) -> Dict[str, any]:
    total_balance = db.query(func.sum(models.Account.balance)).filter(
        models.Account.workspace_id == workspace_id
    ).scalar() or Decimal('0.00')

    today = date.today()
    start_of_month = today.replace(day=1)

    total_income = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.workspace_id == workspace_id,
        models.Transaction.transaction_type == schemas.TransactionType.income.value, # Используем .value
        models.Transaction.transaction_date >= start_of_month
    ).scalar() or Decimal('0.00')

    total_expense = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.workspace_id == workspace_id,
        models.Transaction.transaction_type == schemas.TransactionType.expense.value, # Используем .value
        models.Transaction.transaction_date >= start_of_month
    ).scalar() or Decimal('0.00')

    transactions_count = db.query(models.Transaction).filter(
        models.Transaction.workspace_id == workspace_id
    ).count()

    return {
        "total_balance": f"{total_balance:.2f}",
        "income_this_month": f"{total_income:.2f}",
        "expense_this_month": f"{total_expense:.2f}",
        "transactions_count": transactions_count
    }

def get_cashflow_trend(db: Session, workspace_id: int) -> Dict[str, List[any]]:
    today = date.today()
    labels = []
    income_data = []
    expense_data = []

    for i in range(6):
        target_month_date = today - timedelta(days=i * 30)
        start_of_month = target_month_date.replace(day=1)
        end_of_month = (start_of_month + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        labels.append(start_of_month.strftime("%b %Y"))

        income = db.query(func.sum(models.Transaction.amount)).filter(
            models.Transaction.workspace_id == workspace_id,
            models.Transaction.transaction_type == schemas.TransactionType.income.value, # Используем .value
            models.Transaction.transaction_date.between(start_of_month, end_of_month)
        ).scalar() or 0
        
        expense = db.query(func.sum(models.Transaction.amount)).filter(
            models.Transaction.workspace_id == workspace_id,
            models.Transaction.transaction_type == schemas.TransactionType.expense.value, # Используем .value
            models.Transaction.transaction_date.between(start_of_month, end_of_month)
        ).scalar() or 0
        
        income_data.append(float(income))
        expense_data.append(float(expense))
        
    return {
        "labels": labels[::-1],
        "income": income_data[::-1],
        "expense": expense_data[::-1]
    }