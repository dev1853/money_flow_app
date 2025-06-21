from typing import Any, Dict, List, Optional, Union
from datetime import date
from sqlalchemy.orm import Session, joinedload
from fastapi.encoders import jsonable_encoder

from app.crud.base import CRUDBase
from app import models, schemas

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
        db_obj = self.model(**obj_in_data, owner_id=owner_id, workspace_id=workspace_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        # После создания сразу получаем объект с помощью нашего нового метода get,
        # который подгрузит все связи.
        return self.get(db, id=db_obj.id)

    def update(
        self, db: Session, *, db_obj: models.Transaction, obj_in: Union[schemas.TransactionUpdate, Dict[str, Any]]
    ) -> models.Transaction:
        """
        Обновляет транзакцию и возвращает ее со всеми связанными данными.
        """
        # Сначала обновляем через базовый метод
        updated_transaction = super().update(db=db, db_obj=db_obj, obj_in=obj_in)
        # Затем получаем обновленный объект с помощью нашего нового метода get
        return self.get(db, id=updated_transaction.id)
    
    def get_multi_paginated_by_workspace_and_filters(
        self, db: Session, *, workspace_id: int, page: int = 1, size: int = 20,
        start_date: Optional[date] = None, end_date: Optional[date] = None,
        transaction_type: Optional[schemas.TransactionType] = None, account_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Получает пагинированный список транзакций со связанными данными.
        """
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
            
        total_count = query.count()
        
        skip = (page - 1) * size
        items = query.order_by(self.model.date.desc(), self.model.id.desc()).offset(skip).limit(size).all()
        
        return {"items": items, "total_count": total_count}


transaction = CRUDTransaction(models.Transaction)