from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from .base import CRUDBase
from app import models, schemas
from fastapi.encoders import jsonable_encoder

class CRUDAccount(CRUDBase[models.Account, schemas.AccountCreate, schemas.AccountUpdate]):
    def get_multi_by_workspace(self, db: Session, *, workspace_id: int, skip: int = 0, limit: int = 100) -> List[models.Account]:
        return db.query(self.model).filter(models.Account.workspace_id == workspace_id).offset(skip).limit(limit).all()

    def create_with_owner(
        self, db: Session, *, obj_in: schemas.AccountCreate, owner_id: int
    ) -> schemas.Account:
        obj_in_data = jsonable_encoder(obj_in)
        # При создании объекта модели мы дополнительно передаем owner_id
        db_obj = self.model(**obj_in_data, owner_id=owner_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def create_default_accounts(self, db: Session, *, workspace_id: int, owner_id: int) -> List[models.Account]:
        DEFAULT_ACCOUNTS_DATA = [
            {
                "name": "Кошелек", 
                "account_type": "cash", # <--- ДОБАВЛЕНО
                "currency": "RUB", 
                "initial_balance": 5000,
                "current_balance": 5000,
                "is_active": True
            },
            {
                "name": "Карта Tinkoff", 
                "account_type": "bank_account", # <--- ДОБАВЛЕНО
                "currency": "RUB", 
                "initial_balance": 25000,
                "current_balance": 25000,
                "is_active": True
            }
        ]
        
        created_accounts = []
        for acc_data in DEFAULT_ACCOUNTS_DATA:
            account_to_create = schemas.AccountCreate(**acc_data, workspace_id=workspace_id, owner_id=owner_id)
            created_account = self.create(db=db, obj_in=account_to_create)
            created_accounts.append(created_account)
        return created_accounts

    

    def recalculate_balance(self, db: Session, *, account_id: int) -> models.Account:
        account = self.get(db, id=account_id)
        if account:
            total_transactions = db.query(func.sum(models.Transaction.amount)).filter(models.Transaction.account_id == account_id).scalar()
            account.current_balance = total_transactions or 0.0
            db.add(account)
            db.commit()
            db.refresh(account)
        return account

account = CRUDAccount(models.Account)