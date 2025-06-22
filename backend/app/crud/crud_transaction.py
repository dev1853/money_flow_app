# backend/app/crud/crud_transaction.py

from typing import Any, Dict, List, Optional, Union
from datetime import date
from sqlalchemy.orm import Session, joinedload
from fastapi.encoders import jsonable_encoder

from app.crud.base import CRUDBase
from app import models, schemas
from app.schemas import TransactionType # <--- Этот импорт уже есть

class CRUDTransaction(CRUDBase[models.Transaction, schemas.TransactionCreate, schemas.TransactionUpdate]):

    def get(self, db: Session, id: Any) -> Optional[models.Transaction]:
        """
        Получает одну транзакцию со связанными счетом и статьей ДДС.
        """
        return db.query(self.model).options(
            joinedload(self.model.account),
            joinedload(self.model.dds_article)
        ).filter(self.model.id == id).first()

    def create_with_owner_and_workspace(
        self, db: Session, *, obj_in: schemas.TransactionCreate, owner_id: int, workspace_id: int
    ) -> models.Transaction:
        """
        Создает транзакцию и возвращает ее со всеми связанными данными.
        """
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        # После создания сразу получаем объект с помощью нашего нового метода get,
        # который подгрузит все связи.
        return self.get(db, id=db_obj.id)

    def update(
        self,
        db: Session,
        *,
        db_obj: models.Transaction,
        obj_in: Union[schemas.TransactionUpdate, Dict[str, Any]]
    ) -> models.Transaction:
        """
        Обновляет транзакцию.
        """
        obj_data = jsonable_encoder(db_obj)
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)

        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        # Возвращаем обновленный объект с помощью нашего нового метода get
        return self.get(db, id=db_obj.id)
    
    def get_multi_paginated_by_workspace_and_filters(
        self, db: Session, *, workspace_id: int, page: int = 1, size: int = 20,
        start_date: Optional[date] = None, end_date: Optional[date] = None,
        transaction_type: Optional[schemas.TransactionType] = None, account_id: Optional[int] = None,
        dds_article_id: Optional[int] = None # <--- Этот параметр
    ) -> Dict[str, Any]:
        """
        Получает пагинированный список транзакций со связанными данными, с фильтрами.
        """
        # <--- НОВЫЕ ЛОГИ В НАЧАЛЕ ФУНКЦИИ
        print(f"DEBUG(CRUDTransaction): get_multi_paginated_by_workspace_and_filters invoked.")
        print(f"DEBUG(CRUDTransaction): Filters received: workspace_id={workspace_id}, dds_article_id={dds_article_id}, start_date={start_date}, end_date={end_date}, transaction_type={transaction_type}, account_id={account_id}")
        # >>>>

        query = (
            db.query(self.model)
            .join(models.Account)
            .filter(models.Account.workspace_id == workspace_id)
            .options(
                joinedload(self.model.account),
                joinedload(self.model.dds_article)
            )
        )
        
        if start_date: query = query.filter(self.model.date >= start_date)
        if end_date: query = query.filter(self.model.date <= end_date)
        if transaction_type: query = query.filter(self.model.transaction_type == transaction_type)
        if account_id: query = query.filter(self.model.account_id == account_id)
        
        # <--- КЛЮЧЕВОЕ МЕСТО ДЛЯ ФИЛЬТРАЦИИ ПО DDS_ARTICLE_ID
        if dds_article_id is not None: # Убедимся, что фильтр применяется, если ID не None
            query = query.filter(self.model.dds_article_id == dds_article_id)
            print(f"DEBUG(CRUDTransaction): Applying dds_article_id filter: {dds_article_id}") # <--- НОВЫЙ ЛОГ
        else:
            print(f"DEBUG(CRUDTransaction): dds_article_id filter NOT applied (value is None).") # <--- НОВЫЙ ЛОГ
        # >>>>
            
        # <--- НОВЫЕ ЛОГИ: Показываем SQL-запрос
        print(f"DEBUG(CRUDTransaction): Constructed SQLAlchemy query (before execution): {query}") # <--- ОТОБРАЖАЕМ ЗАПРОС
        # >>>>

        total_count = query.count()
        print(f"DEBUG(CRUDTransaction): Total count AFTER filters: {total_count}") # <--- НОВЫЙ ЛОГ
        
        skip = (page - 1) * size
        items = query.order_by(self.model.date.desc(), self.model.created_at.desc()).offset(skip).limit(size).all()
        
        print(f"DEBUG(CRUDTransaction): Fetched items count: {len(items)}") # <--- НОВЫЙ ЛОГ
        # Для удобства, можно залогировать ID первых нескольких элементов
        print(f"DEBUG(CRUDTransaction): Fetched items IDs (first 5): {[item.id for item in items[:5]]}") # <--- НОВЫЙ ЛОГ
        print(f"DEBUG(CRUDTransaction): Fetched items DDS Article IDs (first 5): {[item.dds_article_id for item in items[:5]]}") # <--- НОВЫЙ ЛОГ

        return {
            "items": items,
            "total_count": total_count
        }

transaction = CRUDTransaction(models.Transaction)