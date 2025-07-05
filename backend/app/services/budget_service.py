# /backend/app/services/budget_service.py

from sqlalchemy.orm import Session
from app import crud, models, schemas
from ..core.exceptions import DdsArticleNotFoundError, PermissionDeniedError

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
        Создает бюджет и все его статьи (items) в рамках одной транзакции.
        """
        # Здесь можно добавить любые бизнес-проверки, если они понадобятся
        # Например, проверка на пересечение дат с другими бюджетами

        try:
            # Делегируем создание самому CRUD, который теперь будет управлять
            # созданием и бюджета, и его дочерних элементов
            budget = crud.budget.create_with_items(
                db=db,
                obj_in=budget_in,
                owner_id=user.id,
                workspace_id=workspace_id
            )
            # Commit происходит в CRUD, но в рамках этого сеанса.
            # В более сложной логике commit лучше вынести сюда.
            return budget
        except Exception:
            db.rollback()
            raise
    
    def get_budget_status(
        self,
        db: Session,
        *,
        budget: models.Budget
    ) -> schemas.BudgetStatus:
        """
        Собирает и рассчитывает полный статус исполнения бюджета.
        """
        items_status: List[schemas.BudgetItemStatus] = []
        total_budgeted = Decimal('0.0')
        total_actual = Decimal('0.0')

        for item in budget.items:
            # Получаем фактические расходы по данной статье за период бюджета
            actual_amount = crud.transaction.get_actual_spending_for_budget_items(
                db=db,
                workspace_id=budget.workspace_id,
                start_date=budget.start_date,
                end_date=budget.end_date,
                article_ids=[item.dds_article_id] # Передаем ID одной статьи
            )
            
            items_status.append(schemas.BudgetItemStatus(
                article_id=item.dds_article_id,
                article_name=item.dds_article.name,
                budgeted_amount=item.budgeted_amount,
                actual_amount=actual_amount
            ))
            
            total_budgeted += item.budgeted_amount
            total_actual += actual_amount
            
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