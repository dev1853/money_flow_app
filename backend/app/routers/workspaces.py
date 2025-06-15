# backend/app/routers/workspaces.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas, models
from ..dependencies import get_db, get_current_user

router = APIRouter(
    prefix="/workspaces",
    tags=["workspaces"],
    dependencies=[Depends(get_current_user)] # Рабочие пространства обычно требуют аутентификации
)

@router.get("/", response_model=List[schemas.Workspace])
async def read_workspaces(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # crud.get_workspaces_by_user - это функция, которую нужно реализовать в crud_workspace.py
    # Или просто получить workspaces напрямую через relationship
    workspaces = current_user.workspaces
    if not workspaces:
        # Если у пользователя нет рабочих пространств, можно создать одно по умолчанию
        # Это должно быть реализовано в crud_user.py при создании пользователя, как мы обсуждали
        # Или здесь, если это разрешено
        pass # Или можно создать HTTPException(status_code=404, detail="No workspaces found")

    return workspaces

@router.post("/", response_model=schemas.Workspace, status_code=201)
async def create_workspace(
    workspace: schemas.WorkspaceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Здесь предполагается функция crud.create_workspace для создания нового рабочего пространства
    # Убедись, что crud_workspace.py (или общий crud.py) содержит такую функцию
    db_workspace = crud.create_workspace(db=db, workspace=workspace, owner_id=current_user.id)
    return db_workspace

# Добавь другие роуты для рабочих пространств по мере необходимости (получение по ID, обновление, удаление)