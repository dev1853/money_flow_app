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
        print(f"--- DEBUG (Service): Сохранение в БД. Данные: {transaction_in.model_dump()}")
        obj_in_data = obj_in.model_dump()
        
        # Создаем объект модели SQLAlchemy, напрямую передавая данные.
        # Теперь ключи в obj_in_data (from_account_id, to_account_id)
        # напрямую соответствуют полям в models.Transaction.
        db_obj = self.model(
            **obj_in_data,
            user_id=owner_id,
            workspace_id=workspace_id
        )
        
        db.add(db_obj)
        # Мы не делаем commit здесь, это задача роутера или сервиса
        db.flush() # Используем flush, чтобы получить ID объекта до коммита
        db.refresh(db_obj)
        print(f"--- DEBUG (Service): Транзакция создана с ID: {db_transaction.id}")
        # Возвращаем созданный объект
        print(f"--- DEBUG (Service): Возвращаем объект: {db_obj.model_dump
        
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

transaction = CRUDTransaction(models.Transaction)