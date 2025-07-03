# backend/app/crud/crud_dashboard.py

from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, case, extract 
from datetime import date, datetime, timedelta 

from .base import CRUDBase
from .. import models, schemas
from fastapi import HTTPException 

class CRUDDashboard(CRUDBase[models.Transaction, schemas.TransactionCreate, schemas.TransactionUpdate]): 
    
    def get_summary_data(
        self, db: Session, *, owner_id: int, workspace_id: int, start_date: date, end_date: date
    ) -> schemas.DashboardSummaryData:
        print(f"DEBUG(Dashboard CRUD): Getting summary data for workspace {workspace_id} from {start_date} to {end_date}")

        common_filters = [
            models.Transaction.workspace_id == workspace_id,
            models.Transaction.created_by_user_id == owner_id,
            models.Transaction.transaction_date >= start_date,
            models.Transaction.transaction_date <= end_date
        ]

        total_income_result = db.query(func.sum(models.Transaction.amount)).join(models.DdsArticle).filter(
            models.DdsArticle.article_type == 'income',
            *common_filters
        ).scalar() or 0.0

        total_expense_result = db.query(func.sum(models.Transaction.amount)).join(models.DdsArticle).filter(
            models.DdsArticle.article_type == 'expense',
            *common_filters
        ).scalar() or 0.0
        
        net_profit_loss = total_income_result - total_expense_result

        summary_item = schemas.SummaryItem(
            currency="RUB", 
            total_income=total_income_result,
            total_expense=total_expense_result,
            net_balance=net_profit_loss
        )

        return schemas.DashboardSummaryData(
            start_date=start_date,
            end_date=end_date,
            summary_by_currency=[summary_item]
        )

    def get_total_income_expense_by_period(
        self,
        db: Session,
        *,
        workspace_id: int,
        owner_id: int,
        start_date: date,
        end_date: date,
        transaction_type: Optional[str] = None,
        account_id: Optional[int] = None,
        dds_article_id: Optional[int] = None
    ) -> Dict[str, Any]:
        query = db.query(
            func.sum(models.Transaction.amount * case(
                (models.DdsArticle.article_type == 'income', 1),
                (models.DdsArticle.article_type == 'expense', -1)
            )).label("total_amount")
        ).join(models.DdsArticle).filter(
            models.Transaction.workspace_id == workspace_id,
            models.Transaction.created_by_user_id == owner_id,
            models.Transaction.transaction_date >= start_date,
            models.Transaction.transaction_date <= end_date
        )

        if transaction_type:
            query = query.filter(models.DdsArticle.article_type == transaction_type)
        if account_id:
            query = query.filter(models.Transaction.account_id == account_id)
        if dds_article_id:
            query = query.filter(models.Transaction.dds_article_id == dds_article_id)

        result = query.scalar() or 0
        return {"total_amount": result}

    def get_cashflow_trend_by_period(
        self,
        db: Session,
        *,
        workspace_id: int,
        owner_id: int,
        start_date: date,
        end_date: date,
        period_type: str = "month"
    ) -> List[schemas.DashboardCashflowTrendData]:
        print(f"--- DEBUG (Trend): get_cashflow_trend_by_period invoked. Period type: {period_type} ---") # ДОБАВЛЕНО

        if period_type == "month":
            group_by_col = func.date_trunc('month', models.Transaction.transaction_date)
            order_by_col = func.date_trunc('month', models.Transaction.transaction_date)
        elif period_type == "day":
            group_by_col = func.date_trunc('day', models.Transaction.transaction_date)
            order_by_col = func.date_trunc('day', models.Transaction.transaction_date)
        elif period_type == "quarter":
            group_by_col = func.date_trunc('quarter', models.Transaction.transaction_date)
            order_by_col = func.date_trunc('quarter', models.Transaction.transaction_date)
        elif period_type == "year":
            group_by_col = func.date_trunc('year', models.Transaction.transaction_date)
            order_by_col = func.date_trunc('year', models.Transaction.transaction_date)
        else:
            raise HTTPException(status_code=400, detail="Неподдерживаемый интервал для тренда.")

        results = db.query(
            group_by_col.label('period_start'),
            func.sum(case((models.DdsArticle.article_type == 'income', models.Transaction.amount), else_=0)).label('total_income'), 
            func.sum(case((models.DdsArticle.article_type == 'expense', models.Transaction.amount), else_=0)).label('total_expense'), 
        ).join(models.DdsArticle).filter(
            models.Transaction.workspace_id == workspace_id,
            models.Transaction.created_by_user_id == owner_id,
            models.Transaction.transaction_date >= start_date,
            models.Transaction.transaction_date <= end_date
        ).group_by(
            group_by_col
        ).order_by(
            order_by_col
        ).all()

        trend_data = []
        for i, row in enumerate(results): # ДОБАВЛЕНО: итератор i
            period_str = None
            if row.period_start: # ДОБАВЛЕНО: Проверяем, что period_start не None
                if period_type == "day":
                    period_str = row.period_start.strftime("%Y-%m-%d")
                else: # month, quarter, year
                    period_str = row.period_start.strftime("%Y-%m") # Общий формат для месяцев, кварталов, годов
            
            print(f"--- DEBUG (Trend - Row {i}): period_start: {row.period_start}, Formatted period_str: {period_str} ---") # ДОБАВЛЕНО

            trend_data.append(schemas.DashboardCashflowTrendData(
                period=period_str if period_str else "Unknown Period", # ИСПРАВЛЕНО: Если period_str None, то "Unknown Period"
                currency="RUB", 
                total_income=row.total_income if row.total_income is not None else Decimal('0.00'), # ИСПРАВЛЕНО: Decimal('0.00')
                total_expense=row.total_expense if row.total_expense is not None else Decimal('0.00'), # ИСПРАВЛЕНО: Decimal('0.00')
                net_balance=(row.total_income - row.total_expense) if row.total_income is not None and row.total_expense is not None else Decimal('0.00') # ИСПРАВЛЕНО: Decimal('0.00')
            ))
        
        print(f"--- DEBUG (Trend): Trend data fetched. Count: {len(trend_data)} ---") # ДОБАВЛЕНО

        return trend_data

dashboard_crud = CRUDDashboard(models.Transaction)