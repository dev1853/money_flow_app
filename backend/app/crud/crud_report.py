from __future__ import annotations
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List
from datetime import date
from decimal import Decimal
from collections import defaultdict

from .crud_dds_article import get_dds_articles_hierarchy
from .. import models

def get_dds_report_data(db: Session, start_date: date, end_date: date, workspace_id: int) -> List['schemas.DDSReportItem']:
    from .. import schemas
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
                    article_type=article.type,
                    total_amount=total_amount,
                    children=children_reports
                )
            )
        return report_items

    return build_report_hierarchy(articles_hierarchy)

def get_account_balances(db: Session, on_date: date, workspace_id: int) -> List['schemas.AccountBalance']:
    from .. import schemas
    accounts = db.query(models.Account).filter(models.Account.workspace_id == workspace_id).all()
    
    result = []
    for account in accounts:
        balance_change = db.query(
            func.sum(
                func.coalesce(
                    func.nullif(
                        case(
                            [(models.Transaction.transaction_type == 'income', models.Transaction.amount)],
                            else_=-models.Transaction.amount
                        ), 0
                    ), 0
                )
            )
        ).filter(
            models.Transaction.account_id == account.id,
            models.Transaction.transaction_date <= on_date
        ).scalar() or Decimal('0.00')
        
        # Начальный баланс + изменение баланса до указанной даты
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
        models.Transaction.transaction_type == 'income'
    ).scalar()
    return total or Decimal('0.00')

def get_total_expense(db: Session, workspace_id: int) -> Decimal:
    total = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.workspace_id == workspace_id,
        models.Transaction.transaction_type == 'expense'
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
    # Эта функция вернет данные для графика
    # Для простоты, вернем заглушку, но вы можете реализовать реальную логику
    return {
        "labels": ["Янв", "Фев", "Мар", "Апр", "Май", "Июн"],
        "income": [100, 120, 110, 130, 150, 140],
        "expense": [80, 90, 85, 100, 110, 105]
    }