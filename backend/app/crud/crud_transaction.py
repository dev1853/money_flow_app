# backend/app/crud/crud_transaction.py

from __future__ import annotations
import csv
import io
import logging
import json
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, case
from typing import List, Optional, Dict, Tuple
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from .base import CRUDBase
from .. import models, schemas
from .crud_account import _update_account_balance_for_transaction, get_account
from .crud_dds_article import DDS_KEYWORD_RULES, get_dds_article
from fastapi import HTTPException, status # Добавлен импорт для HTTPException

logger = logging.getLogger(__name__)

class CRUDTransaction(CRUDBase[models.Transaction, schemas.TransactionCreate, schemas.TransactionUpdate]):
    pass

def get_transaction(db: Session, transaction_id: int):
    return db.query(models.Transaction).filter_by(id=transaction_id).first()

def get_transactions_query(
    db: Session,
    workspace_id: int,
    owner_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    account_id: Optional[int] = None,
    article_id: Optional[int] = None, # Добавил article_id для использования в запросе
    transaction_type: Optional[schemas.TransactionType] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    dds_article_ids: Optional[List[int]] = None
):
    query = db.query(models.Transaction).filter(
        models.Transaction.workspace_id == workspace_id,
        models.Transaction.created_by_user_id == owner_id
    )

    if start_date:
        query = query.filter(models.Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(models.Transaction.transaction_date <= end_date)
    if account_id:
        query = query.filter(models.Transaction.account_id == account_id)
    if article_id: # Использование article_id
        query = query.filter(models.Transaction.dds_article_id == article_id)
    if transaction_type:
        query = query.filter(models.Transaction.transaction_type == transaction_type.value)
    if min_amount is not None:
        query = query.filter(models.Transaction.amount >= min_amount)
    if max_amount is not None:
        query = query.filter(models.Transaction.amount <= max_amount)
    if dds_article_ids:
        query = query.filter(models.Transaction.dds_article_id.in_(dds_article_ids))

    return query.order_by(models.Transaction.transaction_date.desc(), models.Transaction.id.desc())

def get_transactions_with_filters(
    db: Session,
    owner_id: int,
    workspace_id: int,
    skip: int = 0,
    limit: int = 20,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    account_id: Optional[int] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    dds_article_ids: Optional[List[int]] = None
) -> Tuple[List[models.Transaction], int]:

    query = get_transactions_query(
        db,
        workspace_id=workspace_id,
        owner_id=owner_id,
        start_date=start_date,
        end_date=end_date,
        account_id=account_id,
        min_amount=min_amount,
        max_amount=max_amount,
        dds_article_ids=dds_article_ids,
    )

    total_count = query.count()

    transactions = (
        query.options(
            joinedload(models.Transaction.account),
            joinedload(models.Transaction.dds_article),
            joinedload(models.Transaction.created_by)
        )
        .offset(skip).limit(limit).all()
    )
    return transactions, total_count

def create_default_transactions(db: Session, workspace_id: int, user_id: int, accounts_map: Dict[str, int]):
    """
    Создает тестовые транзакции по умолчанию для нового пользователя.
    accounts_map - это словарь { 'название счета': id_счета }
    """
    # Путь к файлу JSON (предполагается, что default_transactions.json лежит в backend/app/)
    # Если ты поместил его рядом с main.py (т.е. в backend/app/), то путь такой:
    file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'default_transactions.json')
    # Если default_transactions.json находится в backend/, то путь будет '..', '..', 'default_transactions.json'

    # Можно добавить лог, чтобы убедиться, что путь корректен
    print(f"Attempting to load default transactions from: {file_path}") # ВРЕМЕННОЕ ЛОГИРОВАНИЕ

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            default_transactions_data = json.load(f)
        print(f"Successfully loaded {len(default_transactions_data)} default transactions from JSON.") # ВРЕМЕННОЕ ЛОГИРОВАНИЕ
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error: Could not load default transactions from {file_path}. Error: {e}. No default transactions created.")
        return

    for transaction_data in default_transactions_data:
        try:
            account_name = transaction_data.get("account_name")
            account_id = accounts_map.get(account_name)

            if not account_id:
                print(f"Warning: Account '{account_name}' not found in map for default transaction. Skipping transaction: {transaction_data}")
                continue

            # Поиск DDS статьи по имени
            dds_article = db.query(models.DDSArticle).filter(
                models.DDSArticle.name == transaction_data["dds_article_name"],
                models.DDSArticle.workspace_id == workspace_id
            ).first()

            if not dds_article:
                print(f"Warning: DDS Article '{transaction_data['dds_article_name']}' not found for default transaction in workspace {workspace_id}. Skipping transaction: {transaction_data}")
                continue

            # Преобразование Decimal (убедись, что импортирован Decimal из decimal)
            amount_decimal = Decimal(str(transaction_data["amount"]))

            transaction_schema = schemas.TransactionCreate(
                transaction_date=date.fromisoformat(transaction_data["date"]),
                amount=amount_decimal,
                currency=transaction_data.get("currency", "RUB"), # Используем "RUB" по умолчанию
                description=transaction_data.get("description"),
                transaction_type=schemas.TransactionType(transaction_data["type"]),
                account_id=account_id,
                dds_article_id=dds_article.id,
            )
            # Вызываем функцию create_transaction (должна быть ниже в этом же файле)
            created_transaction = create_transaction(
                db=db,
                transaction=transaction_schema,
                created_by_user_id=user_id,
                workspace_id=workspace_id
            )
            print(f"Successfully created default transaction: {created_transaction.id} for account {account_name}") # ВРЕМЕННОЕ ЛОГИРОВАНИЕ
        except Exception as e:
            print(f"Error creating default transaction for data {transaction_data}: {e}")
            # Логирование полной трассировки стека здесь может быть полезным для отладки
            import traceback
            traceback.print_exc() # ВРЕМЕННОЕ ЛОГИРОВАНИЕ

def create_transaction(
    db: Session,
    transaction: schemas.TransactionCreate,
    created_by_user_id: int, # <--- ЭТОТ ПАРАМЕТР ДОЛЖЕН БЫТЬ ЗДЕСЬ!
    workspace_id: int
):
    db_transaction = models.Transaction(
        transaction_date=transaction.transaction_date,
        amount=transaction.amount,
        currency=transaction.currency,
        description=transaction.description,
        transaction_type=transaction.transaction_type,
        account_id=transaction.account_id,
        dds_article_id=transaction.dds_article_id,
        created_by_user_id=created_by_user_id, # <--- И ИСПОЛЬЗОВАТЬСЯ ЗДЕСЬ!
        workspace_id=workspace_id
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)

    _update_account_balance_for_transaction(db, db_transaction)

    return db_transaction

def update_transaction(db: Session, transaction_id: int, transaction_update: schemas.TransactionUpdate, workspace_id: int):
    db_transaction = get_transaction(db, transaction_id=transaction_id)
    if not db_transaction:
        return None

    old_amount = db_transaction.amount
    old_account_id = db_transaction.account_id
    old_article_type = db_transaction.dds_article.type

    _update_account_balance_for_transaction(db, old_account_id, workspace_id, old_amount, old_article_type, "revert")

    update_data = transaction_update.model_dump(exclude_unset=True)

    update_data.pop('amount', None)
    update_data.pop('currency', None)
    update_data.pop('transaction_date', None)
    update_data.pop('account_id', None)
    update_data.pop('transaction_type', None)

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
        _update_account_balance_for_transaction(db, db_transaction.account_id, workspace_id, db_transaction.amount, db_transaction.dds_article.type, "revert")

        related_transaction = db_transaction.related_transaction
        if related_transaction:
            _update_account_balance_for_transaction(db, related_transaction.account_id, workspace_id, related_transaction.amount, related_transaction.dds_article.type, "revert")
            db.delete(related_transaction)

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

            suggested_dds_id = find_dds_article_by_keyword(description)
            if suggested_dds_id:
                 dds_article_id = suggested_dds_id
            else:
                 dds_article_id = default_income_article_id if is_income else default_expense_article_id

            article = get_dds_article(db, dds_article_id)
            if not article:
                logger.warning(f"Статья ДДС с ID {dds_article_id} не найдена для строки: {row}. Пропускаем.")
                failed_rows += 1
                failed_row_details.append({"row": row, "error": f"Статья ДДС {dds_article_id} не найдена."})
                continue


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
            create_transaction(db=db, transaction=transaction_schema, created_by_user_id=created_by_user_id, workspace_id=workspace_id)
            created_count += 1

        except (ValueError, KeyError, InvalidOperation) as e:
            failed_rows += 1
            failed_row_details.append({"row": row, "error": str(e)})
            logger.error(f"Ошибка обработки строки: {row}. Причина: {e}")

    final_result = {
        "created_transactions_auto": created_count,
        "failed_rows": failed_rows,
        "skipped_duplicates_count": skipped_duplicates,
        "failed_row_details": failed_row_details
    }
    logger.info(f"Завершение обработки выписки: {final_result}")
    return final_result

transaction = CRUDTransaction(models.Transaction)