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
        end_of_month = (start_of_month + timedelta(days=32)).replace(day=1) - timedelta(days=1)

        # Общий баланс
        total_balance = db.query(func.sum(models.Account.current_balance)).filter(
            models.Account.owner_id == owner_id,
            models.Account.workspace_id == workspace_id
        ).scalar() or 0

        # Доходы и расходы за текущий месяц
        income_vs_expense = db.query(
            func.sum(case((models.Transaction.amount > 0, models.Transaction.amount), else_=0)).label('income'),
            func.sum(case((models.Transaction.amount < 0, models.Transaction.amount), else_=0)).label('expense')
        ).join(models.Account).filter(
            models.Account.owner_id == owner_id,
            models.Account.workspace_id == workspace_id,
            models.Transaction.date >= start_of_month,
            models.Transaction.date <= end_of_month
        ).first()

        return {
            "total_balance": total_balance,
            "monthly_income": income_vs_expense.income or 0,
            "monthly_expense": income_vs_expense.expense or 0
        }

# Создание экземпляра — просто и без аргументов
dashboard = CRUDDashboard()