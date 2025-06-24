from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import date, timedelta
from typing import Dict, Any

from .. import models

class CRUDDashboard:
    """
    Класс для сбора данных для дашборда. Не наследуется от CRUDBase.
    """
    def get_dashboard_data(self, db: Session, *, owner_id: int, workspace_id: int) -> Dict[str, Any]:
        today = date.today()
        start_of_month = today.replace(day=1)
        # Убедимся, что end_of_month правильно рассчитывается
        next_month = start_of_month.replace(day=28) + timedelta(days=4)
        end_of_month = next_month - timedelta(days=next_month.day)

        # Общий баланс (этот запрос был правильным)
        total_balance = db.query(func.sum(models.Account.current_balance)).filter(
            models.Account.owner_id == owner_id,
            models.Account.workspace_id == workspace_id,
            models.Account.is_active == True
        ).scalar() or 0

        # --- ИСПРАВЛЕНИЕ ЗДЕСЬ: используем transaction_type вместо amount > 0 ---
        income_vs_expense = db.query(
            func.sum(case((models.Transaction.transaction_type == 'income', models.Transaction.amount), else_=0)).label('income'),
            func.sum(case((models.Transaction.transaction_type == 'expense', models.Transaction.amount), else_=0)).label('expense')
        ).join(models.Account).filter(
            models.Account.workspace_id == workspace_id,
            models.Transaction.date >= start_of_month,
            models.Transaction.date <= end_of_month
        ).first()

        return {
            "total_balance": total_balance,
            "monthly_income": income_vs_expense.income or 0,
            "monthly_expense": income_vs_expense.expense or 0
        }

    # В этой функции также была ошибка, исправляем и ее
    def get_cashflow_trend_data(self, db: Session, *, workspace_id: int) -> list:
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        trend_data = db.query(
            func.date_trunc('day', models.Transaction.date).label('date'),
            func.sum(case((models.Transaction.transaction_type == 'income', models.Transaction.amount), else_=0)).label("income"),
            func.sum(case((models.Transaction.transaction_type == 'expense', models.Transaction.amount), else_=0)).label("expense")
        ).join(models.Account).filter(
            models.Account.workspace_id == workspace_id,
            models.Transaction.date.between(start_date, end_date)
        ).group_by(
            func.date_trunc('day', models.Transaction.date)
        ).order_by(
            func.date_trunc('day', models.Transaction.date)
        ).all()

        # Форматируем данные для фронтенда
        return [
            {
                "date": item.date.strftime("%Y-%m-%d"),
                "income": item.income or 0,
                "expense": item.expense or 0,
            }
            for item in trend_data
        ]


dashboard = CRUDDashboard()