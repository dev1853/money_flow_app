# backend/app/routers/dashboard.py
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.dependencies import get_db, get_current_active_user, get_workspace_for_user

router = APIRouter(tags=["dashboard"], dependencies=[Depends(get_current_active_user)])

@router.get("/kpis", response_model=Dict[str, Any])
def get_dashboard_kpis(
    *,
    db: Session = Depends(get_db),
    workspace: models.Workspace = Depends(get_workspace_for_user),
):
    # Наша зависимость уже нашла воркспейс и проверила права
    return crud.dashboard.get_dashboard_data(db, owner_id=workspace.owner_id, workspace_id=workspace.id)

@router.get("/cashflow-trend", response_model=List[Dict[str, Any]])
def get_dashboard_cashflow_trend(
    *,
    db: Session = Depends(get_db),
    workspace: models.Workspace = Depends(get_workspace_for_user),
):
    # Наша зависимость уже нашла воркспейс и проверила права
    return crud.dashboard.get_cashflow_trend_data(db, workspace_id=workspace.id)