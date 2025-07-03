# backend/app/crud/crud_report.py

from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_
from datetime import date

from .base import CRUDBase
from .. import models, schemas, crud

# НОВЫЕ ИМПОРТЫ ИЗ report_generators
from .report_generators import dds_report as dds_report_generator # <--- НОВЫЙ ИМПОРТ


class CRUDReport(CRUDBase[models.User, schemas.UserCreate, schemas.UserUpdate]):
    # ... (get, get_multi_by_owner_and_workspace, get_active_rules, find_matching_dds_article_id, get_profit_and_loss_report) ...

    # НОВОЕ: Метод для получения отчета ДДС, который просто вызывает функцию из нового модуля
    def get_dds_report(
        self, db: Session, *, owner_id: int, workspace_id: int, start_date: date, end_date: date
    ) -> List[Dict[str, Any]]:
        """
        Формирует Отчет о движении денежных средств (ДДС), вызывая специализированный генератор.
        """
        return dds_report_generator.get_dds_report( # <--- Вызываем функцию из нового файла
            db=db,
            owner_id=owner_id,
            workspace_id=workspace_id,
            start_date=start_date,
            end_date=end_date
        )

    # НОВОЕ: Метод для получения Отчета о Прибылях и Убытках (ОПиУ)
    # Этот метод пока оставим здесь, пока не вынесем его в отдельный файл profit_loss_report.py
    def get_profit_and_loss_report(
        self, db: Session, *, owner_id: int, workspace_id: int, start_date: date, end_date: date
    ) -> schemas.ProfitLossReport:
        """
        Формирует Отчет о прибылях и убытках (ОПиУ) за указанный период.
        """
        print(f"DEBUG (Report - P&L): Generating P&L report for workspace {workspace_id} from {start_date} to {end_date}")

        total_income_result = db.query(func.sum(models.Transaction.amount)).filter(
            models.Transaction.workspace_id == workspace_id,
            models.Transaction.owner_id == owner_id,
            models.Transaction.transaction_type == 'income',
            models.Transaction.date >= start_date,
            models.Transaction.date <= end_date
        ).scalar() or 0.0

        total_expense_result = db.query(func.sum(models.Transaction.amount)).filter(
            models.Transaction.workspace_id == workspace_id,
            models.Transaction.owner_id == owner_id,
            models.Transaction.transaction_type == 'expense',
            models.Transaction.date >= start_date,
            models.Transaction.date <= end_date
        ).scalar() or 0.0

        net_profit_result = total_income_result - total_expense_result

        print(f"DEBUG (Report - P&L): Total Income: {total_income_result}, Total Expense: {total_expense_result}, Net Profit: {net_profit_result}")

        return schemas.ProfitLossReport(
            total_income=total_income_result,
            total_expense=total_expense_result,
            net_profit=net_profit_result
        )

# Создаем экземпляр CRUD-операций для Report (остается как было)
report_crud = CRUDReport(models.User)