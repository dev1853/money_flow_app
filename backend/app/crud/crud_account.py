# backend/app/crud/crud_account.py

from sqlalchemy.orm import Session, joinedload
from fastapi.encoders import jsonable_encoder
from typing import Any, Dict, List, Optional, Union

from app.crud.base import CRUDBase
from app import models, schemas


class CRUDAccount(CRUDBase[models.Account, schemas.AccountCreate, schemas.AccountUpdate]):

    def create_with_owner(
        self, db: Session, *, obj_in: schemas.AccountCreate, owner_id: int
    ) -> models.Account:
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = self.model(**obj_in_data, owner_id=owner_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi_by_workspace(
        self, db: Session, *, workspace_id: int, skip: int = 0, limit: int = 100
    ) -> List[models.Account]:
        return (
            db.query(self.model)
            .filter(models.Account.workspace_id == workspace_id)
            .order_by(self.model.id)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def create_default_accounts(self, db: Session, *, workspace_id: int, owner_id: int) -> List[models.Account]:
        """
        Создает пару счетов по умолчанию для нового пользователя.
        """
        DEFAULT_ACCOUNTS_DATA = [
            {
                "name": "Кошелек", 
                "account_type": "cash",
                "currency": "RUB", 
                "initial_balance": 5000.0,
                "current_balance": 5000.0,
                "is_active": True
            },
            {
                "name": "Карта Tinkoff", 
                "account_type": "bank_account",
                "currency": "RUB", 
                "initial_balance": 25000.0,
                "current_balance": 25000.0,
                "is_active": True
            }
        ]
        
        created_accounts = []
        for acc_data in DEFAULT_ACCOUNTS_DATA:
            # --- ИЗМЕНЕНИЕ: Создаем объект модели SQLAlchemy напрямую, ---
            # --- минуя Pydantic-схему на этом шаге, чтобы избежать проблем. ---
            db_account = self.model(
                **acc_data,
                workspace_id=workspace_id,
                owner_id=owner_id
            )
            db.add(db_account)
            created_accounts.append(db_account)
        
        # Делаем один commit в конце для всех созданных счетов
        db.commit()
        # Обновляем объекты, чтобы получить их ID из базы
        for acc in created_accounts:
            db.refresh(acc)
            
        return created_accounts
        
    def recalculate_balance(self, db: Session, *, account_id: int):
        account = self.get(db=db, id=account_id)
        if account:
            total_transactions = db.query(
                func.sum(models.Transaction.amount * case((models.Transaction.transaction_type == 'income', 1), (models.Transaction.transaction_type == 'expense', -1)))
            ).filter(models.Transaction.account_id == account_id).scalar() or 0
            
            account.current_balance = account.initial_balance + total_transactions
            db.add(account)
            db.commit()
            db.refresh(account)

account = CRUDAccount(models.Account)