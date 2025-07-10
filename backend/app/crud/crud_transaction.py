# app/crud/crud_transaction.py

from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List, Dict
from datetime import date

from .base import CRUDBase
from .. import models, schemas

class CRUDTransaction(CRUDBase[models.Transaction, schemas.TransactionCreate, schemas.TransactionUpdate]):

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
        Получает общую сумму фактических расходов для списка статей ДДС.
        Учитываются только транзакции типа EXPENSE.
        """
        total_sum = db.query(func.sum(self.model.amount)).filter(
            self.model.workspace_id == workspace_id,
            self.model.transaction_date >= start_date,
            self.model.transaction_date <= end_date,
            self.model.dds_article_id.in_(article_ids),
            # ИСПРАВЛЕНИЕ: Сравниваем со значением Enum
            self.model.transaction_type == models.TransactionType.EXPENSE.value
        ).scalar()
        return total_sum or Decimal('0.0')

    def get_actual_spending_by_article(
        self, db: Session, *, workspace_id: int, start_date: date, end_date: date, article_ids: List[int]
    ) -> Dict[int, Decimal]:
        """
        Рассчитывает расходы по каждой статье ДДС.
        Учитываются только транзакции типа EXPENSE.
        Возвращает словарь {article_id: total_amount}.
        """
        if not article_ids:
            return {}
            
        result = db.query(
            self.model.dds_article_id,
            func.sum(self.model.amount)
        ).filter(
            self.model.workspace_id == workspace_id,
            self.model.transaction_date >= start_date,
            self.model.transaction_date <= end_date,
            self.model.dds_article_id.in_(article_ids),
            self.model.transaction_type == models.TransactionType.EXPENSE # <-- Возвращаем проверку по типу
        ).group_by(
            self.model.dds_article_id
        ).all()
        # abs() больше не нужен, так как суммы положительные
        return {article_id: total for article_id, total in result if total is not None}

    def get_actual_spending_by_article( # Это дублирующаяся функция в вашем коде. Рекомендуется удалить одну из них.
        self, db: Session, *, workspace_id: int, start_date: date, end_date: date, article_ids: List[int]
    ) -> Dict[int, Decimal]:
        """
        Рассчитывает расходы по каждой статье ДДС.
        Учитываются только транзакции типа EXPENSE.
        Возвращает словарь {article_id: total_amount}.
        """
        if not article_ids:
            return {}
            
        result = db.query(
            self.model.dds_article_id,
            func.sum(self.model.amount)
        ).filter(
            self.model.workspace_id == workspace_id,
            self.model.transaction_date >= start_date,
            self.model.transaction_date <= end_date,
            self.model.dds_article_id.in_(article_ids),
            # ИСПРАВЛЕНИЕ: Сравниваем со значением Enum
            self.model.transaction_type == models.TransactionType.EXPENSE.value
        ).group_by(
            self.model.dds_article_id
        ).all()
        
        return {article_id: total for article_id, total in result if total is not None}

    # --- ОСТАЛЬНЫЕ МЕТОДЫ БЕЗ ИЗМЕНЕНИЙ ---
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
        obj_in_data = obj_in.model_dump()
        db_obj = self.model(
            **obj_in_data,
            # ИСПРАВЛЕНИЕ: user_id=owner_id уже удален
            # ИСПРАВЛЕНИЕ: Удаляем workspace_id=workspace_id, так как obj_in_data уже содержит workspace_id
        )
        db.add(db_obj)
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
        return db.query(self.model).filter(models.Transaction.dds_article_id == article_id).count()

# Создаем экземпляр для использования в других модулях
transaction = CRUDTransaction(models.Transaction)# app/crud/crud_transaction.py

from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List, Dict
from datetime import date

from .base import CRUDBase
from .. import models, schemas

class CRUDTransaction(CRUDBase[models.Transaction, schemas.TransactionCreate, schemas.TransactionUpdate]):

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
        Получает общую сумму фактических расходов для списка статей ДДС.
        Учитываются только транзакции типа EXPENSE.
        """
        total_sum = db.query(func.sum(self.model.amount)).filter(
            self.model.workspace_id == workspace_id,
            self.model.transaction_date >= start_date,
            self.model.transaction_date <= end_date,
            self.model.dds_article_id.in_(article_ids),
            # ИСПРАВЛЕНИЕ: Сравниваем со значением Enum
            self.model.transaction_type == models.TransactionType.EXPENSE.value
        ).scalar()
        return total_sum or Decimal('0.0')

    def get_actual_spending_by_article(
        self, db: Session, *, workspace_id: int, start_date: date, end_date: date, article_ids: List[int]
    ) -> Dict[int, Decimal]:
        """
        Рассчитывает расходы по каждой статье ДДС.
        Учитываются только транзакции типа EXPENSE.
        Возвращает словарь {article_id: total_amount}.
        """
        if not article_ids:
            return {}
            
        result = db.query(
            self.model.dds_article_id,
            func.sum(self.model.amount)
        ).filter(
            self.model.workspace_id == workspace_id,
            self.model.transaction_date >= start_date,
            self.model.transaction_date <= end_date,
            self.model.dds_article_id.in_(article_ids),
            self.model.transaction_type == models.TransactionType.EXPENSE # <-- Возвращаем проверку по типу
        ).group_by(
            self.model.dds_article_id
        ).all()
        # abs() больше не нужен, так как суммы положительные
        return {article_id: total for article_id, total in result if total is not None}

    def get_actual_spending_by_article( # Это дублирующаяся функция в вашем коде. Рекомендуется удалить одну из них.
        self, db: Session, *, workspace_id: int, start_date: date, end_date: date, article_ids: List[int]
    ) -> Dict[int, Decimal]:
        """
        Рассчитывает расходы по каждой статье ДДС.
        Учитываются только транзакции типа EXPENSE.
        Возвращает словарь {article_id: total_amount}.
        """
        if not article_ids:
            return {}
            
        result = db.query(
            self.model.dds_article_id,
            func.sum(self.model.amount)
        ).filter(
            self.model.workspace_id == workspace_id,
            self.model.transaction_date >= start_date,
            self.model.transaction_date <= end_date,
            self.model.dds_article_id.in_(article_ids),
            # ИСПРАВЛЕНИЕ: Сравниваем со значением Enum
            self.model.transaction_type == models.TransactionType.EXPENSE.value
        ).group_by(
            self.model.dds_article_id
        ).all()
        
        return {article_id: total for article_id, total in result if total is not None}

    # --- ОСТАЛЬНЫЕ МЕТОДЫ БЕЗ ИЗМЕНЕНИЙ ---
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
        obj_in_data = obj_in.model_dump()
        db_obj = self.model(
            **obj_in_data,
            # ИСПРАВЛЕНИЕ: Удаляем user_id=owner_id (уже сделано)
            # ИСПРАВЛЕНИЕ: Удаляем workspace_id=workspace_id, так как obj_in_data уже содержит workspace_id
        ) #
        db.add(db_obj)
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
        return db.query(self.model).filter(models.Transaction.dds_article_id == article_id).count()

# Создаем экземпляр для использования в других модулях
transaction = CRUDTransaction(models.Transaction)