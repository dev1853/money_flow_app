# backend/app/crud_report.py

from __future__ import annotations
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, case # Добавлен case для get_account_balances
from typing import List, Dict
from datetime import date
from decimal import Decimal
from collections import defaultdict

from .crud_dds_article import get_dds_articles_hierarchy # Импортируем get_dds_articles_hierarchy
from .. import models, schemas # Схемы импортируются здесь

def get_dds_report_data(db: Session, start_date: date, end_date: date, workspace_id: int) -> List[schemas.DDSReportItem]:
    articles_hierarchy = get_dds_articles_hierarchy(db, workspace_id=workspace_id)
    
    transactions_subquery = db.query(
        models.Transaction.dds_article_id,
        func.sum(models.Transaction.amount).label("total_amount")
    ).filter(
        models.Transaction.workspace_id == workspace_id,
        models.Transaction.transaction_date.between(start_date, end_date)
    ).group_by(models.Transaction.dds_article_id).subquery()
    
    article_totals = {
        row.dds_article_id: row.total_amount for row in db.query(transactions_subquery).all()
    }
    
    def build_report_hierarchy(articles: List[models.DDSArticle]) -> List[schemas.DDSReportItem]:
        report_items = []
        for article in articles:
            total_amount = article_totals.get(article.id, Decimal("0.00"))
            children_reports = []
            if hasattr(article, 'children') and article.children:
                children_reports = build_report_hierarchy(article.children)
                total_amount += sum(child.total_amount for child in children_reports)
            
            report_items.append(
                schemas.DDSReportItem(
                    article_id=article.id,
                    article_name=article.name,
                    article_type=article.type, # Использовать .type
                    total_amount=total_amount,
                    children=children_reports
                )
            )
        return report_items

    return build_report_hierarchy(articles_hierarchy)

def get_account_balances(db: Session, on_date: date, workspace_id: int) -> List[schemas.AccountBalance]:
    accounts = db.query(models.Account).filter(models.Account.workspace_id == workspace_id).all()
    
    result = []
    for account in accounts:
        balance_change = db.query(
            func.sum(
                func.coalesce(
                    # Для расчета изменения баланса, доход - это +, расход - это -
                    case(
                        (models.Transaction.transaction_type == schemas.TransactionType.income.value, models.Transaction.amount), # Используем .value для Enum
                        (models.Transaction.transaction_type == schemas.TransactionType.expense.value, -models.Transaction.amount), # Используем .value для Enum
                        else_=0 # Для transfer или других типов
                    ), 0
                )
            )
        ).filter(
            models.Transaction.account_id == account.id,
            models.Transaction.transaction_date <= on_date,
            models.Transaction.workspace_id == workspace_id # Убедимся, что транзакция в том же Workspace
        ).scalar() or Decimal('0.00')
        
        final_balance = (account.initial_balance or Decimal('0.00')) + balance_change
        
        result.append(schemas.AccountBalance(
            account_id=account.id,
            account_name=account.name,
            balance=final_balance,
            currency=account.currency
        ))
    return result

def get_total_income(db: Session, workspace_id: int) -> Decimal:
    total = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.workspace_id == workspace_id,
        models.Transaction.transaction_type == schemas.TransactionType.income.value # Используем .value для Enum
    ).scalar()
    return total or Decimal('0.00')

def get_total_expense(db: Session, workspace_id: int) -> Decimal:
    total = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.workspace_id == workspace_id,
        models.Transaction.transaction_type == schemas.TransactionType.expense.value # Используем .value для Enum
    ).scalar()
    return total or Decimal('0.00')

def get_total_balance(db: Session, workspace_id: int) -> Decimal:
    total = db.query(func.sum(models.Account.balance)).filter(
        models.Account.workspace_id == workspace_id
    ).scalar()
    return total or Decimal('0.00')

def get_transactions_count(db: Session, workspace_id: int) -> int:
    return db.query(models.Transaction).filter(models.Transaction.workspace_id == workspace_id).count()

def get_monthly_cashflow_trend(db: Session, workspace_id: int) -> Dict[str, List]:
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
            models.Transaction.transaction_type == schemas.TransactionType.income.value, # Используем .value для Enum
            models.Transaction.transaction_date.between(start_of_month, end_of_month)
        ).scalar() or 0
        
        expense = db.query(func.sum(models.Transaction.amount)).filter(
            models.Transaction.workspace_id == workspace_id,
            models.Transaction.transaction_type == schemas.TransactionType.expense.value, # Используем .value для Enum
            models.Transaction.transaction_date.between(start_of_month, end_of_month)
        ).scalar() or 0
        
        income_data.append(float(income))
        expense_data.append(float(expense))
        
    return {
        "labels": labels[::-1],
        "income": income_data[::-1],
        "expense": expense_data[::-1]
    }