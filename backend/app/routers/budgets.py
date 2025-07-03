# /backend/app/routers/budgets.py

from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, models, schemas
# --- ИСПРАВЛЕННЫЙ ИМПОРТ ---
from ..dependencies import get_db, get_current_active_user, get_current_active_workspace
from ..services.budget_service import budget_service

router = APIRouter(
    tags=["budgets"],
    dependencies=[Depends(get_current_active_user)],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.Budget, status_code=status.HTTP_201_CREATED)
def create_budget(
    *,
    db: Session = Depends(get_db),
    budget_in: schemas.BudgetCreate,
    current_user: models.User = Depends(get_current_active_user),
    # --- ИСПОЛЬЗУЕМ ПРАВИЛЬНУЮ ЗАВИСИМОСТЬ ---
    current_workspace: models.Workspace = Depends(get_current_active_workspace),
) -> Any:
    """
    Создать новый бюджет в текущем активном рабочем пространстве.
    """
    try:
        # Вся логика теперь в сервисе
        budget = budget_service.create_budget_with_items(
            db=db,
            budget_in=budget_in,
            user=current_user,
            workspace_id=current_workspace.id
        )
        # Так как CRUD больше не делает commit, мы делаем его здесь,
        # после успешного вызова сервисного метода.
        db.commit()
        db.refresh(budget)
        return budget
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        db.rollback()
        # Логируем ошибку
        raise HTTPException(status_code=500, detail="Произошла непредвиденная ошибка при создании бюджета.")


@router.get("/", response_model=List[schemas.Budget])
def read_budgets(
    db: Session = Depends(get_db),
    # --- ИСПОЛЬЗУЕМ ПРАВИЛЬНУЮ ЗАВИСИМОСТЬ ---
    current_workspace: models.Workspace = Depends(get_current_active_workspace),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Получить список бюджетов для текущего активного рабочего пространства.
    """
    return crud.budget.get_multi_by_workspace(
        db, workspace_id=current_workspace.id, skip=skip, limit=limit
    )

@router.get("/{budget_id}/status", response_model=schemas.BudgetStatus)
def get_budget_status(
    *,
    db: Session = Depends(get_db),
    budget_id: int,
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Получить статус исполнения бюджета, включая фактические расходы.
    """
    budget = crud.budget.get(db, id=budget_id)
    if not budget or budget.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Бюджет не найден")

    return budget_service.get_budget_status(db=db, budget=budget)