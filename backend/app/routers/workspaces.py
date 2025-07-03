# /backend/app/routers/workspaces.py

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, models, schemas
# --- ИСПРАВЛЕННЫЙ ИМПОРТ ---
from ..dependencies import (
    get_db,
    get_current_active_user,
    get_current_active_workspace,
    get_workspace_from_path # <-- Наша новая зависимость
)
# --- ИМПОРТИРУЕМ СЕРВИС ---
from ..services.workspace_service import workspace_service

router = APIRouter(
    prefix="/workspaces",
    tags=["workspaces"],
    dependencies=[Depends(get_current_active_user)]
)

@router.post("/", response_model=schemas.Workspace, status_code=status.HTTP_201_CREATED)
def create_workspace(
    *,
    db: Session = Depends(get_db),
    workspace_in: schemas.WorkspaceCreate,
    current_user: models.User = Depends(get_current_active_user)
) -> Any:
    """
    Создать новое рабочее пространство.
    """
    # Делегируем всю логику сервису
    return workspace_service.create_workspace_for_user(
        db=db, workspace_in=workspace_in, user=current_user
    )

@router.get("/", response_model=List[schemas.Workspace])
def read_workspaces(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """
    Получить список всех рабочих пространств, принадлежащих текущему пользователю.
    """
    # Эта операция простая, можно оставить вызов CRUD
    return crud.workspace.get_multi_by_owner(db=db, owner_id=current_user.id)

@router.get("/active", response_model=schemas.Workspace)
def get_active_workspace(
    current_workspace: models.Workspace = Depends(get_current_active_workspace)
) -> Any:
    """
    Получить информацию о текущем активном рабочем пространстве.
    """
    return current_workspace

@router.post("/{workspace_id}/set-active", response_model=schemas.User)
def set_active_workspace(
    *,
    db: Session = Depends(get_db),
    # Используем новую зависимость, чтобы получить воркспейс и проверить права
    workspace_to_set: models.Workspace = Depends(get_workspace_from_path),
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """
    Установить рабочее пространство как активное для текущего пользователя.
    """
    return workspace_service.set_active_workspace(
        db=db, user=current_user, workspace=workspace_to_set
    )

@router.get("/{workspace_id}", response_model=schemas.Workspace)
def read_workspace(
    # Используем новую зависимость, которая находит и проверяет права
    *,
    workspace: models.Workspace = Depends(get_workspace_from_path),
) -> Any:
    """
    Получить рабочее пространство по ID.
    """
    return workspace