# app/crud/crud_transaction.py

from decimal import Decimal
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import Optional, List, Dict, Any
from datetime import date # ИСПРАВЛЕНИЕ: Добавлен импорт date из datetime

from .base import CRUDBase
from .. import models, schemas

class CRUDTransaction(CRUDBase[models.Transaction, schemas.TransactionCreate, schemas.TransactionUpdate]):

    def get(self, db: Session, id: Any) -> Optional[models.Transaction]:
        """
        Получает одну транзакцию по ID, загружая связанные сущности (счета, статьи ДДС, контрагента, договор).
        """
        return db.query(self.model)\
            .options(
                joinedload(models.Transaction.from_account),
                joinedload(models.Transaction.to_account),
                joinedload(models.Transaction.dds_article),
                joinedload(models.Transaction.counterparty),
                joinedload(models.Transaction.contract)
            )\
            .filter(self.model.id == id)\
            .first()

    def get_actual_spending_for_budget_items(
        self,
        db: Session,
        *,
        workspace_id: int,
        start_date: date, # Теперь date определен
        end_date: date,   # Теперь date определен
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
            self.model.transaction_type == models.TransactionType.EXPENSE.value
        ).group_by(
            self.model.dds_article_id
        ).all()
        
        return {article_id: total for article_id, total in result if total is not None}

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
        
        # Убедимся, что user_id и workspace_id из obj_in_data используются
        # и не дублируются внешними owner_id/workspace_id при создании модели.
        # Если obj_in_data уже содержит 'user_id' и 'workspace_id', 
        # то внешние owner_id и workspace_id, переданные в функцию, не нужны для создания db_obj
        # и будут дублировать значения.
        
        # Создаем объект модели, распаковывая данные из схемы.
        # В этом месте user_id и workspace_id уже будут взяты из obj_in_data.
        db_obj = self.model(**obj_in_data) 
        
        # *** ЭТИ СТРОКИ НУЖНО УДАЛИТЬ, ТАК КАК ЗНАЧЕНИЯ УЖЕ УСТАНОВЛЕНЫ ИЗ obj_in_data ***
        # db_obj.user_id = owner_id # Или db_obj.owner_id = owner_id, в зависимости от имени поля в модели
        # db_obj.workspace_id = workspace_id 
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def get_count_by_workspace(
        self,
        db: Session,
        *,
        workspace_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        account_id: Optional[int] = None,
        amount_from: Optional[float] = None,
        amount_to: Optional[float] = None
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
        if amount_from is not None:
            query = query.filter(models.Transaction.amount >= amount_from)
        if amount_to is not None:
            query = query.filter(models.Transaction.amount <= amount_to)
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
        account_id: Optional[int] = None,
        counterparty_id: Optional[int] = None,
        contract_id: Optional[int] = None,
        amount_from: Optional[float] = None,
        amount_to: Optional[float] = None
    ) -> List[models.Transaction]:
        query = db.query(self.model)\
            .options(
                joinedload(models.Transaction.counterparty),
                joinedload(models.Transaction.contract)
            )\
            .filter(models.Transaction.workspace_id == workspace_id)
        
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
        if counterparty_id:
            query = query.filter(models.Transaction.counterparty_id == counterparty_id)
        if contract_id:
            query = query.filter(models.Transaction.contract_id == contract_id)
        if amount_from is not None:
            query = query.filter(models.Transaction.amount >= amount_from)
        if amount_to is not None:
            query = query.filter(models.Transaction.amount <= amount_to)

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