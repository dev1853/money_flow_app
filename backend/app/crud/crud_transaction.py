# backend/app/crud/crud_transaction.py
import os
import json
from sqlalchemy.orm import Session
from typing import List, Dict
from datetime import date, timedelta

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

# Создаем единый экземпляр для импорта в других частях приложения
transaction = CRUDTransaction(models.Transaction)