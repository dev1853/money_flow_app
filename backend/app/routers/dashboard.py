# backend/app/routers/dashboard.py

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from .. import crud, models
from ..dependencies import get_db, get_current_user

# ИСПРАВЛЕНИЕ: Убираем prefix из APIRouter
router = APIRouter(
    tags=["dashboard"],
    dependencies=[Depends(get_current_user)]
)

@router.get("/kpis", response_model=Dict[str, Any])
def get_dashboard_kpis(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    workspace_id: int = Query(...)
):
    # Проверка прав доступа
    if not crud.workspace.is_owner(db=db, workspace_id=workspace_id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions for this workspace")
    
    return crud.dashboard.get_dashboard_data(db, owner_id=current_user.id, workspace_id=workspace_id)

@router.get("/cashflow-trend", response_model=List[Dict[str, Any]])
def get_dashboard_cashflow_trend(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    workspace_id: int = Query(...)
):
    # Проверка прав доступа
    if not crud.workspace.is_owner(db=db, workspace_id=workspace_id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions for this workspace")
        
    # Проверяем, существует ли метод, прежде чем его вызвать
    if hasattr(crud.dashboard, 'get_cashflow_trend_data'):
        return crud.dashboard.get_cashflow_trend_data(db, owner_id=current_user.id, workspace_id=workspace_id)
    else:
        # Возвращаем пустой список, если метод еще не реализован
        return []