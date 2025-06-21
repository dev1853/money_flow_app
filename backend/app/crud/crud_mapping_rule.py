# backend/app/crud/crud_mapping_rule.py

from typing import List, Optional, Dict, Any, Union
from sqlalchemy.orm import Session
from fastapi.encoders import jsonable_encoder
from app.crud.base import CRUDBase
from app import models, schemas

class CRUDMappingRule(CRUDBase[models.MappingRule, schemas.MappingRuleCreate, schemas.MappingRuleUpdate]):
    """
    CRUD-операции для модели MappingRule.
    Наследует базовые методы (get, get_multi, create, update, remove) от CRUDBase.
    """

    def get_multi_by_owner_and_workspace(
        self, db: Session, *, owner_id: int, workspace_id: int, skip: int = 0, limit: int = 100
    ) -> List[models.MappingRule]:
        """
        Получает несколько правил сопоставления по ID владельца и ID рабочего пространства.
        """
        return (
            db.query(self.model)
            .filter(self.model.owner_id == owner_id, self.model.workspace_id == workspace_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_active_rules(
        self, db: Session, *, workspace_id: int, transaction_type: Optional[str] = None
    ) -> List[models.MappingRule]:
        """
        Получает активные правила сопоставления для данного рабочего пространства
        и, опционально, для указанного типа транзакции ('income' или 'expense').
        Правила с transaction_type=None применяются к обоим типам.
        Результаты сортируются по приоритету (от большего к меньшему).
        """
        query = db.query(self.model).filter(
            self.model.workspace_id == workspace_id,
            self.model.is_active == True # Правило должно быть активно
        )
        if transaction_type:
            # Правило применяется, если его transaction_type совпадает с запрошенным
            # или если transaction_type правила не указан (None), т.е. оно универсально
            query = query.filter(
                (self.model.transaction_type == transaction_type) | (self.model.transaction_type == None)
            )
        
        # Сортируем по приоритету (сначала более высокий приоритет), затем по ID
        query = query.order_by(self.model.priority.desc(), self.model.id) 
        
        return query.all()


# Создаем экземпляр CRUD-операций для MappingRule
mapping_rule = CRUDMappingRule(models.MappingRule)