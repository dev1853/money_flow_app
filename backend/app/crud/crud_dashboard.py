# backend/app/crud/crud_dashboard.py

from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, case, extract # <--- Добавлен extract для тренда
from datetime import date, datetime, timedelta # Добавлены datetime, timedelta

from app.crud.base import CRUDBase
from app import models, schemas

class CRUDDashboard(CRUDBase[models.User, schemas.UserCreate, schemas.UserUpdate]):
    
    def get_summary_data(
        self, db: Session, *, owner_id: int, workspace_id: int, start_date: date, end_date: date
    ) -> schemas.DashboardSummaryData:
        """
        Получает сводные данные (общий доход, общий расход, чистая прибыль) за период.
        """
        print(f"DEBUG(Dashboard CRUD): Getting summary data for workspace {workspace_id} from {start_date} to {end_date}")

        # Агрегируем доходы
        total_income_result = db.query(func.sum(models.Transaction.amount)).filter(
            models.Transaction.workspace_id == workspace_id,
            models.Transaction.owner_id == owner_id,
            models.Transaction.transaction_type == 'income',
            models.Transaction.date >= start_date,
            models.Transaction.date <= end_date
        ).scalar() or 0.0

        # Агрегируем расходы
        total_expense_result = db.query(func.sum(models.Transaction.amount)).filter(
            models.Transaction.workspace_id == workspace_id,
            models.Transaction.owner_id == owner_id,
            models.Transaction.transaction_type == 'expense',
            models.Transaction.date >= start_date,
            models.Transaction.date <= end_date
        ).scalar() or 0.0

        net_profit_result = total_income_result - total_expense_result

        print(f"DEBUG(Dashboard CRUD): Summary: Income={total_income_result}, Expense={total_expense_result}, Net={net_profit_result}")

        return schemas.DashboardSummaryData(
            total_income=total_income_result,
            total_expense=total_expense_result,
            net_profit=net_profit_result
        )

    def get_cashflow_trend_data(
        self, db: Session, *, owner_id: int, workspace_id: int, start_date: date, end_date: date,
        interval: str = "day" # 'day', 'month' или 'year'
    ) -> List[schemas.DashboardCashflowTrendData]:
        """
        Получает данные для графика тренда денежных потоков по дням/месяцам.
        """
        print(f"DEBUG(Dashboard CRUD): Getting cashflow trend data for workspace {workspace_id} from {start_date} to {end_date} by {interval}")

        # Определяем, как группировать данные
        if interval == "day":
            group_by_col = models.Transaction.date
        elif interval == "month":
            # func.date_trunc('month', models.Transaction.date) для начала месяца
            # или можно использовать extract для года и месяца
            group_by_col = func.date_trunc('month', models.Transaction.date)
        elif interval == "year":
            group_by_col = func.date_trunc('year', models.Transaction.date)
        else:
            raise HTTPException(status_code=400, detail="Неподдерживаемый интервал для тренда.")


        # Запрос для агрегации доходов и расходов по интервалу
        results = db.query(
            group_by_col.label('event_date'), # Это будет дата начала периода (день, месяц, год)
            func.sum(models.Transaction.amount * case(
                (models.Transaction.transaction_type == 'income', 1),
                else_=0
            )).label('income'),
            func.sum(models.Transaction.amount * case(
                (models.Transaction.transaction_type == 'expense', 1),
                else_=0
            )).label('expense'),
        ).filter(
            models.Transaction.workspace_id == workspace_id,
            models.Transaction.owner_id == owner_id,
            models.Transaction.date >= start_date,
            models.Transaction.date <= end_date
        ).group_by(
            group_by_col
        ).order_by(
            group_by_col
        ).all()

        trend_data = []
        for row in results:
            trend_data.append(schemas.DashboardCashflowTrendData(
                event_date=row.event_date.date() if isinstance(row.event_date, datetime) else row.event_date, # Конвертируем datetime в date, если нужно
                income=row.income or 0.0,
                expense=row.expense or 0.0,
            ))
        
        print(f"DEBUG(Dashboard CRUD): Trend data fetched. Count: {len(trend_data)}")

        return trend_data


dashboard_crud = CRUDDashboard(models.User)