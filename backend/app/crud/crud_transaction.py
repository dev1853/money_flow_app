# /backend/app/crud/crud_transaction.py
from sqlalchemy.orm import Session
from datetime import date
from typing import List
from decimal import Decimal

from .base import CRUDBase
from .. import models, schemas

class CRUDTransaction(CRUDBase[models.Transaction, schemas.TransactionCreate, schemas.TransactionUpdate]):
    def create_with_owner_and_workspace(
        self, 
        db: Session, 
        *, 
        obj_in: schemas.TransactionCreate, 
        owner_id: int, 
        workspace_id: int
    ) -> models.Transaction:
        """
        Просто создает объект транзакции в сессии. Не управляет транзакцией.
        """
        obj_in_data = obj_in.model_dump()
        
        db_obj = self.model(
            **obj_in_data,
            created_by_user_id=owner_id,
            workspace_id=workspace_id
        )
        db.add(db_obj)
        return db_obj

    def get_actual_spending_for_budget_items(
            self,
            db: Session,
            *,
            workspace_id: int,
            start_date: date,
            end_date: date,
            article_ids: List[int]
        ) -> Decimal:
            """
            Рассчитывает сумму фактических расходов по заданным статьям за период.
            """
            total_spent = (
                db.query(func.sum(models.Transaction.amount))
                .filter(
                    models.Transaction.workspace_id == workspace_id,
                    models.Transaction.transaction_date >= start_date,
                    models.Transaction.transaction_date <= end_date,
                    models.Transaction.dds_article_id.in_(article_ids),
                    models.Transaction.transaction_type == schemas.TransactionType.EXPENSE
                )
                .scalar()
            )
            return total_spent or Decimal('0.0')

transaction = CRUDTransaction(models.Transaction)