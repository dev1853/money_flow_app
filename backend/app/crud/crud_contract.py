# backend/app/crud/crud_contract.py

from sqlalchemy.orm import Session, joinedload 
from typing import List, Optional, Any 

from .base import CRUDBase
from .. import models, schemas # ИСПРАВЛЕНО: Импортируем модули models и schemas целиком
# from ..models.contract import Contract # УДАЛЕНО: Больше не нужно, так как импортирован models

class CRUDContract(CRUDBase[models.Contract, schemas.ContractCreate, schemas.ContractUpdate]): # ИСПРАВЛЕНО: Используем models.Contract и schemas.Contract*
    def get(self, db: Session, id: Any) -> Optional[models.Contract]: # ИСПРАВЛЕНО: models.Contract
        """
        Получает один договор по ID, загружая связанного контрагента.
        """
        return db.query(self.model).options(joinedload(models.Contract.counterparty)).filter(self.model.id == id).first() # ИСПРАВЛЕНО: models.Contract.counterparty

    def get_multi_by_workspace(
        self, db: Session, *, workspace_id: int, skip: int = 0, limit: int = 100
    ) -> List[models.Contract]: # ИСПРАВЛЕНО: List[models.Contract]
        """
        Получает список договоров для указанного рабочего пространства, загружая связанных контрагентов.
        """
        return (
            db.query(self.model)
            .options(joinedload(models.Contract.counterparty)) # ИСПРАВЛЕНО: models.Contract.counterparty
            .filter(self.model.workspace_id == workspace_id)
            .order_by(self.model.name)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_multi_by_counterparty(
        self, db: Session, *, counterparty_id: int, skip: int = 0, limit: int = 100
    ) -> List[models.Contract]: # ИСПРАВЛЕНО: List[models.Contract]
        """
        Получает список договоров для указанного контрагента, загружая связанных контрагентов.
        """
        return (
            db.query(self.model)
            .options(joinedload(models.Contract.counterparty)) # ИСПРАВЛЕНО: models.Contract.counterparty
            .filter(self.model.counterparty_id == counterparty_id)
            .order_by(self.model.name)
            .offset(skip)
            .limit(limit)
            .all()
        )

    # НОВЫЙ МЕТОД: Получение общего количества договоров
    def get_count_by_workspace(self, db: Session, *, workspace_id: int) -> int:
        """
        Получает общее количество договоров для указанного рабочего пространства.
        """
        return db.query(self.model).filter(self.model.workspace_id == workspace_id).count()

    def create_with_owner(
        self, db: Session, *, obj_in: schemas.ContractCreate, workspace_id: int
    ) -> models.Contract: # ИСПРАВЛЕНО: models.Contract
        """
        Создает новый договор с привязкой к рабочему пространству.
        """
        db_obj = self.model(**obj_in.model_dump(), workspace_id=workspace_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


# Создаем экземпляр для использования в других модулях
contract = CRUDContract(models.Contract) # ИСПРАВЛЕНО: models.Contract