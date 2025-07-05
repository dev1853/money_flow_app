# backend/app/crud/crud_account_type.py

from typing import Optional
from sqlalchemy.orm import Session

from .base import CRUDBase
from .. import models, schemas # Убедитесь, что AccountType находится в models

class CRUDAccountType(CRUDBase[models.AccountType, schemas.AccountTypeBase, schemas.AccountTypeBase]):
    """
    CRUD операции для модели AccountType.
    """
    def get_by_code(self, db: Session, *, code: str) -> Optional[models.AccountType]:
        """Получить тип счета по его коду (например, 'cash_box')."""
        return db.query(self.model).filter(self.model.code == code).first()

    def get_by_name(self, db: Session, *, name: str) -> Optional[models.AccountType]:
        """Получить тип счета по его имени (например, 'Наличные')."""
        return db.query(self.model).filter(self.model.name == name).first()

# Создаем единственный экземпляр класса для импорта
account_type = CRUDAccountType(models.AccountType)