# /backend/app/services/budget_service.py

import logging
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import crud, models, schemas
from ..core.exceptions import DdsArticleNotFoundError

# Создаем логгер для этого файла
logger = logging.getLogger(__name__)

class BudgetService:
    def create_budget_with_items(
        self,
        db: Session,
        *,
        budget_in: schemas.BudgetCreate,
        user: models.User,
        workspace_id: int
    ) -> models.Budget:
        """
        Создает бюджет, предварительно проверяя на дубликаты.
        """
        # --- ГЛАВНОЕ ИСПРАВЛЕНИЕ ---
        # 1. ПРЕДВАРИТЕЛЬНАЯ ПРОВЕРКА НА ДУБЛИКАТ
        existing_budget = crud.budget.get_by_name_and_period(
            db=db,
            name=budget_in.name,
            workspace_id=workspace_id,
            start_date=budget_in.start_date,
            end_date=budget_in.end_date
        )
        if existing_budget:
            # Если бюджет найден, сразу вызываем ошибку 409
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Бюджет с таким названием и периодом уже существует."
            )

        # 2. Валидация статей ДДС (этот код у вас уже есть и он правильный)
        for item_in in budget_in.items:
            dds_article = crud.dds_article.get(db, id=item_in.dds_article_id)
            if not dds_article or dds_article.workspace_id != workspace_id:
                raise DdsArticleNotFoundError(detail=f"Статья ДДС с ID {item_in.dds_article_id} не найдена.")

        # 3. Если все проверки пройдены, создаем бюджет.
        # Теперь этот вызов НЕ вызовет IntegrityError по этому ограничению.
        budget = crud.budget.create_with_items(
            db=db,
            obj_in=budget_in,
            owner_id=user.id,
            workspace_id=workspace_id
        )
        return budget

    def update_budget_with_items(
        self,
        db: Session,
        *,
        budget_to_update: models.Budget,
        budget_in: schemas.BudgetUpdate,
        user: models.User,
        workspace_id: int
    ) -> models.Budget:
        # ... (этот метод остается без изменений) ...
        update_data = budget_in.model_dump(exclude_unset=True)
        items_data = update_data.pop("items", None)

        updated_budget = crud.budget.update(db=db, db_obj=budget_to_update, obj_in=update_data)
        db.flush()

        if items_data is not None:
            existing_item_ids = {item.id for item in updated_budget.budget_items}
            incoming_item_ids = {item.get('id') for item in items_data if item.get('id')}

            items_to_delete = existing_item_ids - incoming_item_ids
            for item_id in items_to_delete:
                crud.budget_item.remove(db, id=item_id)
                logger.info(f"Удалена статья бюджета {item_id} для бюджета {updated_budget.id}.")

            for item_data in items_data:
                item_id = item_data.get('id')
                dds_article = crud.dds_article.get(db, id=item_data['dds_article_id'])
                if not dds_article or dds_article.workspace_id != workspace_id:
                    raise DdsArticleNotFoundError(detail=f"Статья ДДС с ID {item_data['dds_article_id']} не найдена.")

                if item_id in existing_item_ids:
                    existing_item = crud.budget_item.get(db, id=item_id)
                    if existing_item:
                        crud.budget_item.update(db, db_obj=existing_item, obj_in=item_data)
                        logger.info(f"Обновлена статья бюджета {item_id} для бюджета {updated_budget.id}.")
                else:
                    new_budget_item = models.BudgetItem(
                        budget_id=updated_budget.id,
                        dds_article_id=item_data['dds_article_id'],
                        budgeted_amount=item_data['budgeted_amount']
                    )
                    db.add(new_budget_item)
                    logger.info(f"Добавлена новая статья для бюджета {updated_budget.id}.")

        db.refresh(updated_budget)
        return updated_budget

    # --- ИСПРАВЛЕНИЕ ЗДЕСЬ: Этот метод теперь находится ВНУТРИ класса BudgetService ---
    def get_budget_status(self, db: Session, budget: models.Budget) -> schemas.BudgetStatus:
        """
        Собирает детальную информацию и статус выполнения для конкретного бюджета.
        """
        items_status = []
        total_budgeted = Decimal('0.0')
        total_actual = Decimal('0.0')

        article_ids = [item.dds_article_id for item in budget.budget_items]
        
        actuals_map = {}
        if article_ids:
            actuals_map = crud.transaction.get_actual_spending_by_article(
                db=db,
                workspace_id=budget.workspace_id,
                start_date=budget.start_date,
                end_date=budget.end_date,
                article_ids=article_ids
            )

        for item in budget.budget_items:
            budgeted = item.budgeted_amount if item.budgeted_amount is not None else Decimal('0.0')
            actual = actuals_map.get(item.dds_article_id, Decimal('0.0'))

            items_status.append(schemas.BudgetItemStatus(
                article_id=item.dds_article_id,
                article_name=item.dds_article.name,
                budgeted_amount=budgeted,
                actual_amount=actual
            ))
            
            total_budgeted += budgeted
            total_actual += actual

        return schemas.BudgetStatus(
            budget_id=budget.id,
            budget_name=budget.name,
            start_date=budget.start_date,
            end_date=budget.end_date,
            total_budgeted=total_budgeted,
            total_actual=total_actual,
            items_status=items_status
        )


budget_service = BudgetService()
