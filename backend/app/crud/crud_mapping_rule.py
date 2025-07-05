# backend/app/crud/crud_mapping_rule.py

from typing import List, Optional, Dict, Any, Union
from sqlalchemy.orm import Session, joinedload
from fastapi.encoders import jsonable_encoder
from sqlalchemy import or_ 
from app.schemas.mapping_rule import MappingRuleCreate, MappingRuleUpdate

from .base import CRUDBase
from .. import models, schemas

class CRUDMappingRule(CRUDBase[models.MappingRule, schemas.MappingRuleCreate, schemas.MappingRuleUpdate]):
    def create(self, db: Session, *, obj_in: schemas.MappingRuleCreate, owner_id: int, workspace_id: int) -> models.MappingRule:
        """
        Переопределенный метод создания, который включает owner_id и workspace_id.
        """
        obj_in_data = obj_in.model_dump() # Используем model_dump() для Pydantic V2

        db_obj = self.model(**obj_in_data)
        db_obj.owner_id = owner_id
        db_obj.workspace_id = workspace_id
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get(self, db: Session, id: Any) -> Optional[models.MappingRule]:
        return db.query(self.model).options(
            joinedload(models.MappingRule.dds_article)
        ).filter(self.model.id == id).first()

    def get_multi_by_owner_and_workspace(
        self, db: Session, *, owner_id: int, workspace_id: int, skip: int = 0, limit: int = 100
    ) -> Dict[str, Any]:
        """
        Получает пагинированный список правил сопоставления по ID владельца и ID рабочего пространства.
        """
        query = (
            db.query(self.model)
            .filter(self.model.owner_id == owner_id, self.model.workspace_id == workspace_id)
            .options(joinedload(models.MappingRule.dds_article)) # Жадно загружаем dds_article
        )
        
        total_count = query.count()
        
        rules = query.offset(skip).limit(limit).all()
        
        return {
            "items": rules,
            "total_count": total_count
        }

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
            self.model.is_active == True
        )
        if transaction_type:
            query = query.filter(
                (self.model.transaction_type == transaction_type) | (self.model.transaction_type == None)
            )
        
        query = query.order_by(self.model.priority.desc(), self.model.id) 
        
        return query.all()
    
    def find_matching_dds_article_id(
        self, db: Session, *, workspace_id: int, description: str, transaction_type: schemas.TransactionType
    ) -> Optional[int]:
        """
        Ищет подходящую статью ДДС на основе описания транзакции и её типа,
        используя активные правила сопоставления.

        Возвращает ID статьи ДДС, если найдено совпадение, иначе None.
        """
        print(f"DEBUG (Auto-categorization - CRUDRule): Searching for rules for workspace {workspace_id}, type '{transaction_type}', description: '{description}'")
        rules = self.get_active_rules(
            db=db, workspace_id=workspace_id, transaction_type=transaction_type
        )
        print(f"DEBUG (Auto-categorization - CRUDRule): Found {len(rules)} active rules.")

        for rule in rules:
            print(f"DEBUG (Auto-categorization - CRUDRule): Checking rule '{rule.keyword}' (Priority: {rule.priority}, Type: {rule.transaction_type})...")
            if rule.keyword.lower() in description.lower():
                print(f"DEBUG (Auto-categorization - CRUDRule): Rule matched: '{rule.keyword}' -> DDS Article ID: {rule.dds_article_id} (Article Name: {rule.dds_article.name})")
                return rule.dds_article_id
        
        print(f"DEBUG (Auto-categorization - CRUDRule): No rule matched for description '{description}' and type '{transaction_type}'. Returning None.")
        return None
    
    def get_by_keyword_and_workspace(self, db: Session, *, keyword: str, workspace_id: int) -> Optional[models.MappingRule]:
        """Получает правило сопоставления по ключевому слову и ID рабочего пространства."""
        return db.query(self.model).filter(
            self.model.keyword == keyword,
            self.model.workspace_id == workspace_id
        ).first()
        
    def create_with_owner(
        self, db: Session, *, obj_in: MappingRuleCreate, owner_id: int, workspace_id: int
    ) -> models.MappingRule:
        obj_in_data = obj_in.model_dump() # Используем model_dump() для Pydantic v2
        db_obj = self.model(**obj_in_data, owner_id=owner_id, workspace_id=workspace_id)
        db.add(db_obj)
        # db.commit() # Commit делается на уровне сервиса
        # db.refresh(db_obj) # Refresh тоже делается на уровне сервиса, если нужно
        return db_obj

# Создаем экземпляр CRUD-операций для MappingRule
mapping_rule = CRUDMappingRule(models.MappingRule)