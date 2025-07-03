# /backend/app/crud/crud_budget.py

from sqlalchemy.orm import Session
from typing import List
from fastapi import HTTPException

from .base import CRUDBase
from ..models import Budget, BudgetItem, DdsArticle
from ..schemas import BudgetCreate, BudgetUpdate

class CRUDBudget(CRUDBase[Budget, BudgetCreate, BudgetUpdate]):
    
    # Метод переименован для ясности
    def create_with_items(self, db: Session, *, obj_in: BudgetCreate, owner_id: int, workspace_id: int) -> Budget:
        """
        Создает новый бюджет и все его связанные статьи (items).
        Управление транзакцией (commit/rollback) осуществляется в сервисном слое.
        """
        db_obj = Budget(
            name=obj_in.name,
            start_date=obj_in.start_date,
            end_date=obj_in.end_date,
            owner_id=owner_id,
            workspace_id=workspace_id
        )
        db.add(db_obj)
        db.flush()  # Получаем ID бюджета до коммита

        for item_in in obj_in.items:
            dds_article = db.query(DdsArticle).filter(DdsArticle.id == item_in.dds_article_id).first()
            if not dds_article:
                # Лучше выбрасывать кастомное исключение, а не HTTPException из CRUD
                raise ValueError(f"Статья ДДС с ID {item_in.dds_article_id} не найдена.")
            
            db_item = BudgetItem(
                budget_id=db_obj.id,
                dds_article_id=item_in.dds_article_id,
                budgeted_amount=item_in.budgeted_amount,
                type=dds_article.article_type
            )
            db.add(db_item)
        
        # УБИРАЕМ db.commit()! Это делает сервис.
        return db_obj

    def get_multi_by_workspace(self, db: Session, *, workspace_id: int, skip: int = 0, limit: int = 100) -> List[Budget]:
        return (
            db.query(self.model)
            .filter(self.model.workspace_id == workspace_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

budget = CRUDBudget(Budget)