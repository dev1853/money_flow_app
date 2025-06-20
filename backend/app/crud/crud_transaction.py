# backend/app/crud/crud_transaction.py
import os
import json
from sqlalchemy.orm import Session
from typing import List, Any, Dict, Optional 
from datetime import date
from fastapi.encoders import jsonable_encoder 
from sqlalchemy.orm import joinedload

from .base import CRUDBase
from app import models, schemas

class CRUDTransaction(CRUDBase[models.Transaction, schemas.TransactionCreate, schemas.TransactionUpdate]):
    """
    CRUD-класс для операций с транзакциями.
    """
    def get_multi_by_account(
        self, db: Session, *, account_id: int, skip: int = 0, limit: int = 100
    ) -> List[models.Transaction]:
        return (
            db.query(self.model)
            .filter(models.Transaction.account_id == account_id)
            .order_by(models.Transaction.date.desc(), models.Transaction.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create_default_transactions(self, db: Session, *, workspace_id: int, user_id: int, accounts_map: Dict[str, int]):
        """
        Создает набор транзакций по умолчанию из JSON-файла.
        Теперь это метод класса.
        """
        file_path = os.path.join(os.path.dirname(__file__), '..', '..', 'default_transactions.json')
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                transactions_data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            print(f"Warning: Could not load default transactions from {file_path}")
            return

        for tx_data in transactions_data:
            if tx_data.get("account_name") not in accounts_map:
                continue

            # Преобразуем дату в строку, чтобы избежать ошибок с SQLite в тестах
            transaction_date = (date.today() - timedelta(days=tx_data.get("date_offset_days", 0))).isoformat()

            transaction_schema = schemas.TransactionCreate(
                date=transaction_date,
                amount=tx_data["amount"],
                description=tx_data.get("description", ""),
                account_id=accounts_map[tx_data["account_name"]],
                transaction_type=tx_data["transaction_type"],
                created_by_user_id=user_id,
                workspace_id=workspace_id
            )
            # Вызываем базовый метод create через self
            self.create(db=db, obj_in=transaction_schema)
            
    def create_with_owner_and_workspace(
        self,
        db: Session,
        *,
        obj_in: schemas.TransactionCreate,
        owner_id: int,
        workspace_id: int
    ) -> models.Transaction:
        """
        Создает транзакцию с указанием владельца и рабочего пространства.
        """
        obj_in_data = jsonable_encoder(obj_in)
        # Мы явно добавляем owner_id и workspace_id к данным из схемы
        db_obj = self.model(**obj_in_data, owner_id=owner_id, workspace_id=workspace_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

            
    def get_multi_paginated_by_workspace_and_filters(
        self,
        db: Session,
        *,
        workspace_id: int,
        page: int = 1,
        size: int = 20,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        transaction_type: Optional[schemas.TransactionType] = None,
        account_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        
        # Начинаем строить запрос
        query = (
            db.query(self.model)
            .join(models.Account)
            .filter(models.Account.workspace_id == workspace_id)
            .options(
                joinedload(self.model.account), 
                joinedload(self.model.dds_article)
            )
        )
        
        # Применяем фильтры, если они есть
        if start_date:
            query = query.filter(self.model.date >= start_date)
        if end_date:
            query = query.filter(self.model.date <= end_date)
        if transaction_type:
            query = query.filter(self.model.transaction_type == transaction_type)
        if account_id:
            query = query.filter(self.model.account_id == account_id)
            
        # Сначала считаем общее количество записей с учетом фильтров
        total_count = query.count()
        
        # Затем применяем пагинацию
        skip = (page - 1) * size
        items = query.order_by(self.model.date.desc(), self.model.id.desc()).offset(skip).limit(size).all()
        
        return {"items": items, "total_count": total_count}

# Создаем единый экземпляр для импорта в других частях приложения
transaction = CRUDTransaction(models.Transaction)