# backend/app/crud/crud_counterparty.py

from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import func 

from .base import CRUDBase
from .. import models, schemas # ИСПРАВЛЕНО: Импортируем модули models и schemas целиком
# from ..models.counterparty import Counterparty # УДАЛЕНО: Больше не нужно, так как импортирован models

class CRUDCounterparty(CRUDBase[models.Counterparty, schemas.CounterpartyCreate, schemas.CounterpartyUpdate]): # ИСПРАВЛЕНО: Используем models.Counterparty и schemas.Counterparty*
    def get_multi_by_workspace(
        self, db: Session, *, workspace_id: int, skip: int = 0, limit: int = 100, search: Optional[str] = None, type: Optional[models.CounterpartyType] = None # ИСПРАВЛЕНО: models.CounterpartyType
    ) -> List[models.Counterparty]: # ИСПРАВЛЕНО: List[models.Counterparty]
        """
        Получает список контрагентов для указанного рабочего пространства, с учетом фильтров.
        """
        query = db.query(self.model).filter(self.model.workspace_id == workspace_id)
        if search:
            # Поиск по имени или контактной информации
            query = query.filter(
                models.Counterparty.name.ilike(f"%{search}%") | 
                models.Counterparty.contact_info.ilike(f"%{search}%") 
            )
        if type:
            query = query.filter(models.Counterparty.type == type)

        return (
            query.order_by(self.model.name)
            .offset(skip)
            .limit(limit)
            .all()
        )

    # НОВЫЙ МЕТОД: Получение общего количества контрагентов с фильтрами
    def get_count_by_workspace(self, db: Session, *, workspace_id: int, search: Optional[str] = None, type: Optional[models.CounterpartyType] = None) -> int: # ИСПРАВЛЕНО: models.CounterpartyType
        """
        Получает общее количество контрагентов для указанного рабочего пространства, с учетом фильтров.
        """
        query = db.query(self.model).filter(self.model.workspace_id == workspace_id)
        if search:
            query = query.filter(
                models.Counterparty.name.ilike(f"%{search}%") | 
                models.Counterparty.contact_info.ilike(f"%{search}%")
            )
        if type:
            query = query.filter(models.Counterparty.type == type)
        return query.count()

    def create_with_owner(
        self, db: Session, *, obj_in: schemas.CounterpartyCreate, owner_id: int, workspace_id: int
    ) -> models.Counterparty: # ИСПРАВЛЕНО: models.Counterparty
        """
        Создает нового контрагента с привязкой к пользователю и рабочему пространству.
        """
        db_obj = self.model(**obj_in.model_dump(), owner_id=owner_id, workspace_id=workspace_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


# Создаем единственный экземпляр
counterparty = CRUDCounterparty(models.Counterparty) # ИСПРАВЛЕНО: models.Counterparty