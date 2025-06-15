# backend/app/routers/workspaces.py
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

# ИЗМЕНЕНИЕ: импортируем конкретные схемы
from .. import crud, auth_utils, models
from ..schemas import Workspace, WorkspaceCreate
from ..database import get_db

# Создаем роутер для управления рабочими пространствами
router = APIRouter(
    prefix="/api/workspaces",
    tags=["Workspaces"],
    dependencies=[Depends(auth_utils.get_current_active_user)]
)


@router.post("", response_model=Workspace)
def create_workspace(
    workspace: WorkspaceCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth_utils.get_current_active_user)
):
    """
    Создает новое рабочее пространство для текущего пользователя.
    """
    return crud.create_workspace_for_user(db=db, workspace=workspace, user_id=current_user.id)

@router.get("", response_model=List[Workspace])
def read_workspaces(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth_utils.get_current_active_user)
):
    """
    Возвращает список рабочих пространств, доступных текущему пользователю.
    """
    workspaces = crud.get_workspaces_for_user(db, user_id=current_user.id)
    return workspaces