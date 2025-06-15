from __future__ import annotations
from sqlalchemy.orm import Session
from decimal import Decimal
import logging

from .. import models

# Настройка логирования
logger = logging.getLogger(__name__)

def get_account(db: Session, account_id: int):
    return db.query(models.Account).filter_by(id=account_id).first()

def create_account(db: Session, account: 'schemas.AccountCreate', workspace_id: int, user_id: int):
    from .. import schemas
    db_account = models.Account(**account.dict(), workspace_id=workspace_id, owner_id=user_id)
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

def get_accounts(db: Session, workspace_id: int):
    return db.query(models.Account).filter_by(workspace_id=workspace_id).order_by(models.Account.name).all()

def update_account(db: Session, account_id: int, account_update: 'schemas.AccountUpdate'):
    from .. import schemas
    db_account = get_account(db, account_id=account_id)
    if not db_account:
        return None
    update_data = account_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_account, key, value)
    db.commit()
    db.refresh(db_account)
    return db_account

def delete_account(db: Session, account_id: int):
    db_account = get_account(db, account_id=account_id)
    if db_account:
        db.delete(db_account)
        db.commit()
    return db_account

def _update_account_balance_for_transaction(
    db: Session, 
    account_id: int, 
    workspace_id: int,
    amount: Decimal, 
    article_type: str, 
    operation: str = "apply"
) -> bool:
    """
    Обновляет баланс счета.
    operation: "apply" (применить транзакцию) или "revert" (откатить транзакцию)
    Возвращает True в случае успеха, False, если счет не найден.
    """
    account_to_update = db.query(models.Account).filter(
        models.Account.id == account_id,
        models.Account.workspace_id == workspace_id
    ).first()

    if not account_to_update:
        logger.warning(f"Счет с ID {account_id} не найден в рабочем пространстве {workspace_id} при обновлении баланса.")
        return False
    
    multiplier = 1 if operation == "apply" else -1
    
    if article_type == 'income':
        account_to_update.balance += amount * multiplier
    elif article_type == 'expense':
        account_to_update.balance -= amount * multiplier
    
    db.commit()
    return True

def create_default_accounts(db: Session, workspace_id: int, user_id: int):
    """
    Создает стандартные счета ('Наличные', 'Банковская карта') для нового рабочего пространства.
    """
    from .. import schemas # Локальный импорт

    default_accounts = [
        {"name": "Наличные", "currency": "RUB", "initial_balance": Decimal("0.00")},
        {"name": "Банковская карта", "currency": "RUB", "initial_balance": Decimal("0.00")}
    ]

    for acc_data in default_accounts:
        # Убедимся, что balance тоже передается, так как он есть в AccountCreate
        acc_data['balance'] = acc_data['initial_balance']
        account_schema = schemas.AccountCreate(**acc_data)
        
        # Используем существующую функцию create_account из этого же файла
        create_account(
            db=db,
            account=account_schema,
            workspace_id=workspace_id,
            user_id=user_id
        )