from __future__ import annotations
import csv
import io
import logging
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional, Dict
from datetime import date, datetime
from decimal import Decimal, InvalidOperation

from .crud_account import _update_account_balance_for_transaction
from .crud_dds_article import DDS_KEYWORD_RULES
from .. import models

# Настройка логирования
logger = logging.getLogger(__name__)

def get_transaction(db: Session, transaction_id: int):
    return db.query(models.Transaction).filter_by(id=transaction_id).first()

def get_transactions_query(
    db: Session,
    workspace_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    account_id: Optional[int] = None,
    article_id: Optional[int] = None,
    transaction_type: Optional['schemas.TransactionType'] = None
):
    from .. import schemas
    query = db.query(models.Transaction).filter(models.Transaction.workspace_id == workspace_id)
    if start_date:
        query = query.filter(models.Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(models.Transaction.transaction_date <= end_date)
    if account_id:
        query = query.filter(models.Transaction.account_id == account_id)
    if article_id:
        query = query.filter(models.Transaction.dds_article_id == article_id)
    if transaction_type:
        query = query.filter(models.Transaction.transaction_type == transaction_type.value)
        
    return query.order_by(models.Transaction.transaction_date.desc(), models.Transaction.created_at.desc())

def create_transaction(db: Session, transaction: 'schemas.TransactionCreate', created_by_user_id: int, workspace_id: int):
    from .. import schemas
    db_transaction = models.Transaction(
        **transaction.dict(),
        created_by_user_id=created_by_user_id,
        workspace_id=workspace_id
    )
    db.add(db_transaction)
    
    article = db.query(models.DDSArticle).filter(models.DDSArticle.id == transaction.dds_article_id).first()
    if not article:
        raise ValueError(f"Статья ДДС с id {transaction.dds_article_id} не найдена.")

    _update_account_balance_for_transaction(db, transaction.account_id, workspace_id, transaction.amount, article.type, "apply")

    if transaction.transaction_type == schemas.TransactionType.transfer:
        if transaction.related_account_id and transaction.related_transaction_id is None:
            # Создаем связанную транзакцию "зеркально"
            related_article = db.query(models.DDSArticle).filter(
                models.DDSArticle.id != article.id,
                models.DDSArticle.workspace_id == workspace_id,
                models.DDSArticle.type != article.type
            ).first()
            if not related_article:
                raise ValueError("Не найдена подходящая статья для обратной транзакции перевода.")
            
            related_transaction_schema = schemas.TransactionCreate(
                transaction_date=transaction.transaction_date,
                amount=transaction.amount,
                currency=transaction.currency,
                description=f"Перевод со счета {db_transaction.account.name}",
                transaction_type=schemas.TransactionType.transfer,
                account_id=transaction.related_account_id,
                dds_article_id=related_article.id,
                related_account_id=transaction.account_id
            )
            related_db_transaction = models.Transaction(
                **related_transaction_schema.dict(),
                created_by_user_id=created_by_user_id,
                workspace_id=workspace_id
            )
            db.add(related_db_transaction)
            _update_account_balance_for_transaction(db, transaction.related_account_id, workspace_id, transaction.amount, related_article.type, "apply")
            
            db.flush()
            db_transaction.related_transaction_id = related_db_transaction.id
            related_db_transaction.related_transaction_id = db_transaction.id

    db.commit()
    db.refresh(db_transaction)
    return db_transaction


def update_transaction(db: Session, transaction_id: int, transaction_update: 'schemas.TransactionUpdate', workspace_id: int):
    from .. import schemas
    db_transaction = get_transaction(db, transaction_id=transaction_id)
    if not db_transaction:
        return None

    old_amount = db_transaction.amount
    old_account_id = db_transaction.account_id
    old_article_type = db_transaction.dds_article.type

    _update_account_balance_for_transaction(db, old_account_id, workspace_id, old_amount, old_article_type, "revert")

    update_data = transaction_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_transaction, key, value)
    
    db.flush()
    
    new_amount = db_transaction.amount
    new_account_id = db_transaction.account_id
    new_article_type = db_transaction.dds_article.type

    _update_account_balance_for_transaction(db, new_account_id, workspace_id, new_amount, new_article_type, "apply")

    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def delete_transaction(db: Session, transaction_id: int, workspace_id: int):
    db_transaction = get_transaction(db, transaction_id=transaction_id)
    if db_transaction:
        related_transaction = db_transaction.related_transaction
        if related_transaction:
            _update_account_balance_for_transaction(db, related_transaction.account_id, workspace_id, related_transaction.amount, related_transaction.dds_article.type, "revert")
            db.delete(related_transaction)
            
        _update_account_balance_for_transaction(db, db_transaction.account_id, workspace_id, db_transaction.amount, db_transaction.dds_article.type, "revert")
        db.delete(db_transaction)
        db.commit()
    return db_transaction


def find_dds_article_by_keyword(description: str) -> Optional[int]:
    for rule in DDS_KEYWORD_RULES:
        for keyword in rule["keywords"]:
            if keyword.lower() in description.lower():
                return rule["dds_article_id"]
    return None

def process_tinkoff_statement(db: Session, csv_data_str: str, account_id: int, default_income_article_id: int, default_expense_article_id: int, created_by_user_id: int, workspace_id: int) -> Dict:
    from .. import schemas
    reader = csv.reader(io.StringIO(csv_data_str), delimiter=';')
    header = next(reader)
    
    created_count = 0
    failed_rows = 0
    skipped_duplicates = 0
    failed_row_details = []

    for row in reader:
        try:
            row_dict = dict(zip(header, row))
            
            transaction_date_str = row_dict["Дата операции"]
            transaction_date = datetime.strptime(transaction_date_str, "%d.%m.%Y %H:%M:%S").date()
            
            description = row_dict.get("Описание", "")
            amount_str = row_dict["Сумма операции"].replace(',', '.')
            amount = abs(Decimal(amount_str))
            currency = row_dict["Валюта операции"]
            
            is_income = Decimal(amount_str) > 0
            
            if find_dds_article_by_keyword(description):
                 dds_article_id = find_dds_article_by_keyword(description)
            else:
                 dds_article_id = default_income_article_id if is_income else default_expense_article_id

            article = get_dds_article(db, dds_article_id)
            if not article: continue

            transaction_type = schemas.TransactionType.income if article.type == 'income' else schemas.TransactionType.expense

            existing_transaction = db.query(models.Transaction).filter(
                and_(
                    models.Transaction.transaction_date == transaction_date,
                    models.Transaction.amount == amount,
                    models.Transaction.description == description,
                    models.Transaction.account_id == account_id
                )
            ).first()

            if existing_transaction:
                skipped_duplicates += 1
                continue
            
            transaction_schema = schemas.TransactionCreate(
                transaction_date=transaction_date,
                amount=amount,
                currency=currency,
                description=description,
                transaction_type=transaction_type,
                account_id=account_id,
                dds_article_id=dds_article_id,
            )
            create_transaction(db, transaction_schema, created_by_user_id, workspace_id)
            created_count += 1
        
        except (ValueError, KeyError, InvalidOperation) as e:
            failed_rows += 1
            failed_row_details.append({"row": row, "error": str(e)})
            logger.error(f"Ошибка обработки строки: {row}. Причина: {e}")

    final_result = {
        "created_count": created_count,
        "failed_rows": failed_rows,
        "skipped_duplicates": skipped_duplicates,
        "failed_row_details": failed_row_details
    }
    logger.info(f"Завершение обработки выписки: {final_result}")
    return final_result