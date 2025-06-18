# backend/app/routers/workspaces.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas, models
from ..dependencies import get_db, get_current_active_user 

router = APIRouter(
    tags=["workspaces"],
    responses={404: {"description": "Not found"}}
)

@router.get("/", response_model=List[schemas.Workspace])
def read_workspaces(
    db: Session = Depends(get_db), # <--- Используем get_db напрямую
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Получение списка рабочих пространств текущего пользователя.
    """
    workspaces = crud.workspace.get_multi_by_owner(
        db, owner_id=current_user.id, skip=skip, limit=limit
    )
    return workspaces

@router.post("/", response_model=schemas.Workspace)
def create_workspace(
    workspace: schemas.WorkspaceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Создает новое рабочее пространство для текущего пользователя.
    """
    return crud.workspace.create_with_owner(db=db, obj_in=workspace, owner_id=current_user.id)