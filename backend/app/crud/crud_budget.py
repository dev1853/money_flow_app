# /backend/app/crud/crud_budget.py

from datetime import date
from decimal import Decimal
from typing import List, Optional, Any

from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from .base import CRUDBase


class CRUDBudget(CRUDBase[models.Budget, schemas.BudgetCreate, schemas.BudgetUpdate]):

    def get_by_name_and_period(
        self, db: Session, *, name: str, workspace_id: int, start_date: date, end_date: date
    ) -> Optional[models.Budget]:
        """
        Находит бюджет по имени, воркспейсу и периоду.
        Используется для проверки на дубликаты.
        """
        return db.query(self.model).filter(
            self.model.name == name,
            self.model.workspace_id == workspace_id,
            self.model.start_date == start_date,
            self.model.end_date == end_date
        ).first()

    def create_with_items(
        self, db: Session, *, obj_in: schemas.BudgetCreate, owner_id: int, workspace_id: int
    ) -> models.Budget:
        
        # 1. Извлекаем данные из схемы
        budget_data = obj_in.model_dump()
        items_data = budget_data.pop("items", [])

        # --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
        # 2. Безопасно удаляем ключ 'workspace_id' из словаря, так как мы передадим его явно.
        # Это предотвратит ошибку "multiple values".
        budget_data.pop('workspace_id', None)
        
        # 3. Теперь мы можем безопасно передать workspace_id как отдельный аргумент
        db_budget = self.model(**budget_data, owner_id=owner_id, workspace_id=workspace_id)
        
        db.add(db_budget)
        db.flush() # Используем flush, чтобы получить ID для db_budget

        # 4. Создаем связанные элементы
        for item_data in items_data:
            db_item = models.BudgetItem(
                **item_data,
                budget_id=db_budget.id
            )
            db.add(db_item)

        db.commit()
        db.refresh(db_budget)
        return db_budget

    def get(self, db: Session, id: Any) -> Optional[models.Budget]:
        return db.query(self.model).options(
            joinedload(models.Budget.budget_items).joinedload(models.BudgetItem.dds_article)
        ).filter(self.model.id == id).first()

    def get_multi_by_workspace(
        self, db: Session, *, workspace_id: int, skip: int = 0, limit: int = 100
    ) -> List[models.Budget]:
        """
        Получает список бюджетов для рабочего пространства.
        """
        from app import crud

        budgets_list = db.query(self.model).options(
            joinedload(models.Budget.budget_items).joinedload(models.BudgetItem.dds_article)
        ).filter(
            models.Budget.workspace_id == workspace_id
        ).order_by(models.Budget.end_date.desc()).offset(skip).limit(limit).all()

        if not budgets_list:
            return []

        # Расчеты фактических/плановых сумм
        for budget in budgets_list:
            total_budgeted = sum(item.budgeted_amount for item in budget.budget_items)
            final_budgeted = total_budgeted if total_budgeted is not None else Decimal('0.0')

            article_ids = [item.dds_article_id for item in budget.budget_items]
            actual_spending = None
            if article_ids:
                actual_spending = crud.transaction.get_actual_spending_for_budget_items(
                    db=db,
                    workspace_id=workspace_id,
                    start_date=budget.start_date,
                    end_date=budget.end_date,
                    article_ids=article_ids
                )
            
            final_actual = actual_spending if actual_spending is not None else Decimal('0.0')
            final_deviation = final_budgeted - final_actual

            budget.total_budgeted = final_budgeted
            budget.total_actual = final_actual
            budget.total_deviation = final_deviation

        return budgets_list


budget = CRUDBudget(models.Budget)