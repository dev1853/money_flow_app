# backend/app/crud/crud_report.py

from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_
from datetime import date
from typing import List, Dict, Any, Optional
from decimal import Decimal # Импортируем Decimal

from app import models, schemas
from .base import CRUDBase

class CRUDReport(CRUDBase[models.Transaction, schemas.TransactionCreate, schemas.TransactionUpdate]):

    def get_dds_report(
        self, db: Session, *, owner_id: int, workspace_id: int, start_date: date, end_date: date
    ) -> List[schemas.DdsReportItem]:
        dds_articles = db.query(models.DdsArticle).filter(
            models.DdsArticle.workspace_id == workspace_id
        ).order_by(models.DdsArticle.name).all()

        report_data = []

        common_transaction_filters = [
            models.Transaction.workspace_id == workspace_id,
            models.Transaction.user_id == owner_id,
        ]

        # Расчет общего оборота для определения процента
        total_turnover_sum_query = db.query(
            func.sum(
                case(
                    (models.DdsArticle.article_type == 'income', models.Transaction.amount),
                    (models.DdsArticle.article_type == 'expense', -models.Transaction.amount),
                    else_=0
                )
            )
        ).join(models.DdsArticle).filter(
            *common_transaction_filters,
            models.Transaction.transaction_date >= start_date,
            models.Transaction.transaction_date <= end_date
        )
        total_report_turnover = total_turnover_sum_query.scalar() or Decimal('0.0')

        for article in dds_articles:
            initial_balance_query = db.query(
                func.sum(
                    case(
                        (models.DdsArticle.article_type == 'income', models.Transaction.amount),
                        (models.DdsArticle.article_type == 'expense', -models.Transaction.amount),
                        else_=0
                    )
                )
            ).join(models.DdsArticle).filter(
                *common_transaction_filters,
                models.Transaction.dds_article_id == article.id,
                models.Transaction.transaction_date < start_date
            )
            initial_balance = initial_balance_query.scalar() or Decimal('0.0')

            turnover_query = db.query(
                func.sum(
                    case(
                        (models.DdsArticle.article_type == 'income', models.Transaction.amount),
                        (models.DdsArticle.article_type == 'expense', -models.Transaction.amount),
                        else_=0
                    )
                )
            ).join(models.DdsArticle).filter(
                *common_transaction_filters,
                models.Transaction.dds_article_id == article.id,
                models.Transaction.transaction_date >= start_date,
                models.Transaction.transaction_date <= end_date
            )
            turnover = turnover_query.scalar() or Decimal('0.0')

            final_balance = initial_balance + turnover

            # Расчет amount и percentage_of_total
            percentage_of_total = Decimal('0.0')
            if total_report_turnover != Decimal('0.0'):
                # Убедимся, что turnover не является слишком большим или маленьким для корректного расчета процента
                percentage_of_total = (turnover / total_report_turnover * Decimal('100.0')).quantize(Decimal('0.01'))

            report_data.append(
                schemas.DdsReportItem(
                    article_id=article.id,
                    article_name=article.name,
                    article_type=article.article_type,
                    initial_balance=initial_balance,
                    turnover=turnover,
                    final_balance=final_balance,
                    amount=turnover, # Это может быть также abs(turnover) в зависимости от того, что ожидается
                    percentage_of_total=percentage_of_total
                )
            )
        return report_data
    
    def get_profit_loss_report(
        self, db: Session, *, owner_id: int, workspace_id: int, start_date: date, end_date: date
    ) -> schemas.ProfitLossReport:
        common_filters = [
            models.Transaction.workspace_id == workspace_id,
            models.Transaction.user_id == owner_id,
            models.Transaction.transaction_date >= start_date,
            models.Transaction.transaction_date <= end_date
        ]

        total_income = db.query(func.sum(models.Transaction.amount)).join(models.DdsArticle).filter(
            models.DdsArticle.article_type == 'income',
            *common_filters
        ).scalar() or Decimal('0.0')

        total_expense = db.query(func.sum(models.Transaction.amount)).join(models.DdsArticle).filter(
            models.DdsArticle.article_type == 'expense',
            *common_filters
        ).scalar() or Decimal('0.0')

        net_profit = total_income - total_expense

        return schemas.ProfitLossReport(
            total_income=total_income,
            total_expense=total_expense,
            net_profit=net_profit
        )

report_crud = CRUDReport(models.Transaction)