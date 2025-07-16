# /backend/app/routers/budgets.py

import logging 
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from .. import crud, models, schemas
from ..dependencies import get_db, get_current_active_user, get_workspace_from_query
from app.services.budget_service import budget_service

logger = logging.getLogger(__name__)
router = APIRouter(
    tags=["budgets"],
    dependencies=[Depends(get_current_active_user)],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[schemas.Budget])
def read_budgets(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    workspace: models.Workspace = Depends(get_workspace_from_query),
):
    """
    Получить список всех бюджетов для текущего рабочего пространства.
    """
    budgets = crud.budget.get_multi_by_workspace(
        db, workspace_id=workspace.id, skip=skip, limit=limit
    )
    return budgets

@router.post("/", response_model=schemas.Budget, status_code=status.HTTP_201_CREATED)
def create_budget(
    *,
    db: Session = Depends(get_db),
    budget_in: schemas.BudgetCreate,  # Данные бюджета приходят здесь
    current_user: models.User = Depends(get_current_active_user),
    # Мы убрали некорректную зависимость get_current_active_workspace
):
    """
    Создать новый бюджет.
    """
    # --- НОВАЯ ЛОГИКА ПРОВЕРКИ ДОСТУПА ---
    # 1. Проверяем, что воркспейс, указанный в данных формы, существует и доступен пользователю.
    # Убедитесь, что у вас есть такая или похожая функция в crud.workspace
    workspace = crud.workspace.get(db, id=budget_in.workspace_id)
    if not workspace or workspace.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="У вас нет прав на создание бюджета в этом рабочем пространстве."
        )
    
    # 2. Если проверка пройдена, вызываем сервис для создания бюджета
    try:
        # Убедитесь, что ваш сервис budget_service правильно использует budget_in
        budget = budget_service.create_budget_with_items(
            db=db,
            budget_in=budget_in,
            user=current_user,
            workspace_id=budget_in.workspace_id
        )
        return budget
    except IntegrityError:
        db.rollback() 
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Бюджет с таким названием и периодом уже существует.",
        )
    except Exception as e:
        db.rollback()
        logger.exception("Непредвиденная ошибка при создании бюджета")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Произошла непредвиденная ошибка: {e}",
        )

@router.put("/{budget_id}", response_model=schemas.Budget)
def update_budget(
    *,
    db: Session = Depends(get_db),
    budget_id: int,
    budget_in: schemas.BudgetUpdate,
    current_user: models.User = Depends(get_current_active_user),
    workspace: models.Workspace = Depends(get_workspace_from_query),
) -> Any:
    """
    Обновить существующий бюджет.
    """
    existing_budget = crud.budget.get(db, id=budget_id)
    if not existing_budget or existing_budget.workspace_id != workspace.id:
        # Убрал проверку owner_id, так как доступ к workspace уже проверяется
        # Если нужна проверка и на владельца бюджета, можно вернуть `or existing_budget.owner_id != current_user.id`
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Бюджет не найден или у вас нет доступа.")

    try:
        updated_budget = budget_service.update_budget_with_items(
            db=db,
            budget_to_update=existing_budget,
            budget_in=budget_in,
            user=current_user,
            workspace_id=workspace.id
        )
        # Коммит лучше делать в самом конце, если все прошло успешно
        db.commit()
        db.refresh(updated_budget)
        return updated_budget

    except ValueError as e:
        db.rollback()
        # Возвращаем 400 Bad Request, так как это ошибка валидации данных
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    except IntegrityError as e:
        db.rollback()
        # Проверяем, что это ошибка уникальности
        if "unique constraint" in str(e.orig).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Бюджет с таким названием и периодом уже существует."
            )
        # Для других ошибок целостности базы данных
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ошибка целостности данных в базе."
        )

    # --- КЛЮЧЕВОЕ ИЗМЕНЕНИЕ ЗДЕСЬ ---
    except Exception as e:
        db.rollback() # Откатываем транзакцию в любом случае

        # 1. ЛОГИРУЕМ ПОЛНЫЙ TRACEBACK
        # Эта строка напечатает полную трассировку ошибки в вашу консоль или лог-файл
        logger.exception("Произошла непредвиденная ошибка при обновлении бюджета ID: %s", budget_id)

        # 2. ВОЗВРАЩАЕМ КЛИЕНТУ ИНФОРМАТИВНЫЙ ОТВЕТ
        # Клиенту не нужно видеть детали ошибки, ему достаточно знать, что что-то пошло не так
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Произошла непредвиденная ошибка на сервере."
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

@router.get("/{budget_id}/status", response_model=schemas.BudgetStatus)
def get_budget_status_endpoint(
    *,
    db: Session = Depends(get_db),
    budget_id: int,
    workspace: models.Workspace = Depends(get_workspace_from_query),
):
    """
    Получить детальный статус выполнения бюджета.
    """
    budget = crud.budget.get(db, id=budget_id)
    if not budget or budget.workspace_id != workspace.id:
        raise HTTPException(status_code=404, detail="Бюджет не найден")

    # Этот вызов должен теперь работать, так как метод есть в сервисе
    return budget_service.get_budget_status(db=db, budget=budget)