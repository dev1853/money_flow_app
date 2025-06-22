# backend/app/crud/crud_mapping_rule.py

from typing import List, Optional, Dict, Any, Union
from sqlalchemy.orm import Session, joinedload
from fastapi.encoders import jsonable_encoder
from sqlalchemy import or_ 

from app.crud.base import CRUDBase
from app import models, schemas

class CRUDMappingRule(CRUDBase[models.MappingRule, schemas.MappingRuleCreate, schemas.MappingRuleUpdate]):
    
    def get(self, db: Session, id: Any) -> Optional[models.MappingRule]:
        return db.query(self.model).options(
            joinedload(models.MappingRule.dds_article)
        ).filter(self.model.id == id).first()

    def get_multi_by_owner_and_workspace(
        self, db: Session, *, owner_id: int, workspace_id: int, skip: int = 0, limit: int = 100
    ) -> Dict[str, Any]: # <--- ИЗМЕНЕН ТИП ВОЗВРАЩАЕМОГО ЗНАЧЕНИЯ
        """
        Получает пагинированный список правил сопоставления по ID владельца и ID рабочего пространства.
        """
        query = (
            db.query(self.model)
            .filter(self.model.owner_id == owner_id, self.model.workspace_id == workspace_id)
            .options(joinedload(models.MappingRule.dds_article)) # Жадно загружаем dds_article
        )
        
        total_count = query.count() # Получаем общее количество до применения limit/offset
        
        rules = query.offset(skip).limit(limit).all() # Получаем правила для текущей страницы
        
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
    
    def find_matching_dds_article_id(
        self, db: Session, *, workspace_id: int, description: str, transaction_type: schemas.TransactionType
    ) -> Optional[int]:
        """
        Ищет подходящую статью ДДС на основе описания транзакции и её типа,
        используя активные правила сопоставления.

        Возвращает ID статьи ДДС, если найдено совпадение, иначе None.
        """
        print(f"DEBUG (Auto-categorization - CRUDRule): Searching for rules for workspace {workspace_id}, type '{transaction_type}', description: '{description}'") # <--- ЛОГ
        # Получаем все активные правила для данного рабочего пространства и типа транзакции
        # Они уже отсортированы по приоритету (начиная с более высокого)
        rules = self.get_active_rules(
            db=db, workspace_id=workspace_id, transaction_type=transaction_type
        )
        print(f"DEBUG (Auto-categorization - CRUDRule): Found {len(rules)} active rules.") # <--- ЛОГ

        for rule in rules:
            print(f"DEBUG (Auto-categorization - CRUDRule): Checking rule '{rule.keyword}' (Priority: {rule.priority}, Type: {rule.transaction_type})...") # <--- ЛОГ
            # Преобразуем ключевое слово и описание в нижний регистр для регистронезависимого поиска
            if rule.keyword.lower() in description.lower():
                print(f"DEBUG (Auto-categorization - CRUDRule): Rule matched: '{rule.keyword}' -> DDS Article ID: {rule.dds_article_id} (Article Name: {rule.dds_article.name})") # <--- ЛОГ
                return rule.dds_article_id
        
        print(f"DEBUG (Auto-categorization - CRUDRule): No rule matched for description '{description}' and type '{transaction_type}'. Returning None.") # <--- ЛОГ
        return None # Если совпадений не найдено

# Создаем экземпляр CRUD-операций для MappingRule
mapping_rule = CRUDMappingRule(models.MappingRule)