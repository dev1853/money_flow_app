# /backend/app/crud/crud_account.py
from sqlalchemy.orm import Session
from ..schemas.account import AccountCreate, AccountUpdate # Убедитесь, что импорт корректен
from ..models import Account
from typing import List, Optional
from decimal import Decimal
from sqlalchemy import func

from .base import CRUDBase
from .. import models, schemas

class CRUDAccount(CRUDBase[models.Account, AccountCreate, AccountUpdate]): # Используем обновленные схемы
    def create_with_owner(self, db: Session, *, obj_in: AccountCreate, owner_id: int) -> Account:
        """
        Создает счет, используя данные из схемы и ID владельца.
        initial_balance из схемы используется для установки начального баланса счета.
        """
        obj_in_data = obj_in.model_dump() 
        
        # Извлекаем initial_balance из входных данных
        initial_balance_value = obj_in_data.pop("initial_balance")
        
        # Создаем объект модели, используя оставшиеся данные и явно устанавливая balance
        db_obj = self.model(**obj_in_data, owner_id=owner_id, balance=initial_balance_value)
        db.add(db_obj)
        db.flush() 
        return db_obj

    # Остальные методы класса остаются без изменений
    def get_by_name(self, db: Session, *, name: str, workspace_id: int) -> Optional[models.Account]:
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
        
    def get_total_balance_by_workspace(self, db: Session, *, workspace_id: int) -> Decimal:
        """Считает общую сумму на всех счетах в рабочем пространстве."""
        total = db.query(func.sum(self.model.balance)).filter(self.model.workspace_id == workspace_id).scalar()
        return total or Decimal('0.0')

account = CRUDAccount(models.Account)