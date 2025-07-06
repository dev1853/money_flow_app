# app/crud/crud_transaction.py

from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from datetime import date

from .base import CRUDBase
from .. import models, schemas
from ..schemas import TransactionCreate, TransactionUpdate

class CRUDTransaction(CRUDBase[models.Transaction, TransactionCreate, TransactionUpdate]):
    def get_by_description_amount_date_type_account_workspace(
        self, db: Session, *, 
        description: str, amount: Decimal, transaction_date: date, transaction_type: models.TransactionType, 
        from_account_id: int, workspace_id: int
    ) -> Optional[models.Transaction]:
        return db.query(self.model).filter(
            self.model.description == description,
            self.model.amount == amount,
            self.model.transaction_date == transaction_date,
            self.model.transaction_type == transaction_type,
            self.model.from_account_id == from_account_id,
            self.model.workspace_id == workspace_id
        ).first()


    def create_with_owner(
        self, db: Session, *, obj_in: schemas.TransactionCreate, owner_id: int, workspace_id: int
    ) -> models.Transaction:
        """
        Создает транзакцию, используя данные из схемы и добавляя ID владельца и воркспейса.
        """
        obj_in_data = obj_in.model_dump()
        
        db_obj = self.model(
            **obj_in_data,
            user_id=owner_id,
            workspace_id=workspace_id
        )
        
        db.add(db_obj)
        # Коммит выполняется на уровне сервиса, а не CRUD
        db.flush() 
        db.refresh(db_obj)
        return db_obj
    
    def get_count_by_workspace(
        self,
        db: Session,
        *,
        workspace_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        account_id: Optional[int] = None
    ) -> int:
        """
        Получает общее количество транзакций в воркспейсе с учетом фильтров.
        """
        query = db.query(self.model).filter(models.Transaction.workspace_id == workspace_id)

        if start_date:
            query = query.filter(models.Transaction.transaction_date >= start_date)
        if end_date:
            query = query.filter(models.Transaction.transaction_date <= end_date)
        
        if account_id:
            query = query.filter(
                or_(
                    models.Transaction.from_account_id == account_id,
                    models.Transaction.to_account_id == account_id
                )
            )
        return query.count()
    
    def get_multi_by_workspace(
        self,
        db: Session,
        *,
        workspace_id: int,
        skip: int = 0,
        limit: int = 100,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        account_id: Optional[int] = None
    ) -> List[models.Transaction]:
        """
        Получает список транзакций в воркспейсе с учетом фильтров и пагинации.
        """
        query = db.query(self.model).filter(models.Transaction.workspace_id == workspace_id)

        if start_date:
            query = query.filter(models.Transaction.transaction_date >= start_date)
        if end_date:
            query = query.filter(models.Transaction.transaction_date <= end_date)
        
        if account_id:
            query = query.filter(
                or_(
                    models.Transaction.from_account_id == account_id,
                    models.Transaction.to_account_id == account_id
                )
            )
        return (
            query.order_by(models.Transaction.transaction_date.desc(), models.Transaction.id.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        
    def get_count_by_dds_article(self, db: Session, *, article_id: int) -> int:
        """
        Получает количество транзакций, связанных с определенной статьей ДДС.
        """
        return db.query(self.model).filter(models.Transaction.dds_article_id == article_id).count()

transaction = CRUDTransaction(models.Transaction)