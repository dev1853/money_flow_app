# backend/app/crud/crud_report.py

from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_, or_ # <-- Добавлен or_ для фильтрации по счетам
from datetime import date
from typing import List, Dict, Any, Optional # <-- Добавлен Optional
from decimal import Decimal 

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
                    amount=turnover, 
                    percentage_of_total=percentage_of_total
                )
            )
        return report_data
    
    # ИСПРАВЛЕНИЕ: Обновлена сигнатура функции, добавлены новые параметры
    def get_profit_loss_report(
        self,
        db: Session,
        *,
        owner_id: int,
        workspace_id: int,
        start_date: date,
        end_date: date,
        period_type: Optional[str] = None, # Например, "day", "month", "quarter", "year"
        compare_to_previous_period: Optional[bool] = False,
        account_ids: Optional[List[int]] = None
    ) -> schemas.ProfitLossReport: # Тип ответа может потребовать изменений в схеме ProfitLossReport
        # Инициализируем базовые фильтры
        query_filters = [
            models.Transaction.workspace_id == workspace_id,
            models.Transaction.user_id == owner_id,
            models.Transaction.transaction_date >= start_date,
            models.Transaction.transaction_date <= end_date
        ]

        # ИСПРАВЛЕНИЕ: Добавление фильтра по account_ids
        if account_ids:
            # Фильтруем транзакции, которые затрагивают любой из указанных счетов
            account_filter_condition = (models.Transaction.from_account_id.in_(account_ids)) | \
                                     (models.Transaction.to_account_id.in_(account_ids))
            query_filters.append(account_filter_condition)


        # Логика для period_type и сравнения (будет реализована позже)
        # Если period_type указан, отчет должен быть агрегирован по этим периодам.
        # Это потребует более сложной логики запросов и, возможно, другой структуры возвращаемых данных.
        if period_type:
            # TODO: Реализовать агрегацию по period_type (day, month, quarter, year)
            # Это будет включать группировку транзакций по периодам и расчет дохода/расхода для каждого периода.
            # Тип возвращаемого значения этой функции может потребоваться изменить на List[schemas.ProfitLossPeriodItem].
            print(f"DEBUG: Агрегация по типу периода: {period_type} будет реализована.")

        # Если compare_to_previous_period = True, нужно сгенерировать отчет за предыдущий период
        # и вернуть оба набора данных.
        if compare_to_previous_period:
            # TODO: Реализовать логику сравнения
            # Рассчитать total_income, total_expense, net_profit для предыдущего периода.
            # Схема возвращаемого значения также должна будет включать данные для сравнения.
            print("DEBUG: Сравнение с предыдущим периодом будет реализовано.")


        total_income = db.query(func.sum(models.Transaction.amount)).join(models.DdsArticle).filter(
            models.DdsArticle.article_type == 'income',
            *query_filters # Применяем все фильтры
        ).scalar() or Decimal('0.0')

        total_expense = db.query(func.sum(models.Transaction.amount)).join(models.DdsArticle).filter(
            models.DdsArticle.article_type == 'expense',
            *query_filters # Применяем все фильтры
        ).scalar() or Decimal('0.0')
        
        net_profit = total_income - total_expense

        return schemas.ProfitLossReport(
            total_income=total_income,
            total_expense=total_expense,
            net_profit=net_profit
        )

report_crud = CRUDReport(models.Transaction)