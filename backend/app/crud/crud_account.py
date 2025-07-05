# /backend/app/crud/crud_account.py
from sqlalchemy.orm import Session
from ..schemas import AccountCreate, AccountUpdate
from ..models import Account
from typing import List, Optional
from decimal import Decimal

from .base import CRUDBase
from .. import models, schemas

class CRUDAccount(CRUDBase[models.Account, schemas.AccountCreate, schemas.AccountUpdate]):
    def create_with_owner(self, db: Session, *, obj_in: AccountCreate, owner_id: int) -> Account:
        """
        Создает счет, используя данные из схемы и ID владельца.
        ID рабочего пространства и ID типа счета берутся из самой схемы.
        """
        # ИСПРАВЛЕНИЕ: Используем model_dump() для Pydantic v2
        obj_in_data = obj_in.model_dump() 
        
        # account_type_id и workspace_id будут находиться в obj_in_data
        db_obj = self.model(**obj_in_data, owner_id=owner_id)
        db.add(db_obj)
        db.flush() # Используем flush для получения ID до коммита
        return db_obj

    def get_by_name(self, db: Session, *, name: str, workspace_id: int) -> Optional[models.Account]:
        # Этот метод не использует account_type_id напрямую, поэтому он в порядке
        return db.query(self.model).filter(
            self.model.name == name,
            self.model.workspace_id == workspace_id
        ).first()

    def get_multi_by_workspace(
        self, db: Session, *, workspace_id: int, skip: int = 0, limit: int = 100
    ) -> List[Account]:
        return (
            db.query(self.model)
            .filter(Account.workspace_id == workspace_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def update_balance(self, db: Session, *, account_id: int, amount_change: Decimal) -> models.Account:
        """
        Атомарно обновляет баланс счета на указанную сумму.
        Использует for_update() для блокировки строки на время транзакции,
        чтобы предотвратить race conditions.
        """
        account = db.query(models.Account).filter_by(id=account_id).with_for_update().one()
        
        if account.balance + amount_change < 0:
            raise ValueError("Недостаточно средств на счете.")

        account.balance += amount_change
        
        db.add(account)
        return account
    
    def get_by_name_and_workspace(self, db: Session, *, name: str, workspace_id: int) -> Optional[models.Account]:
        """Получает счет по имени и ID рабочего пространства."""
        return db.query(self.model).filter(
            self.model.name == name,
            self.model.workspace_id == workspace_id
        ).first()

account = CRUDAccount(models.Account)