# backend/app/routers/dashboard.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, Any

from .. import crud, auth_utils, models
from ..database import get_db

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
    dependencies=[Depends(auth_utils.get_current_active_user)]
)

@router.get("/kpis", response_model=Dict[str, Any])
def get_dashboard_kpis(
    workspace_id: int = Query(..., description="ID рабочего пространства"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user)
):
    crud.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    return crud.get_kpis(db, workspace_id=workspace_id)

@router.get("/cashflow-trend", response_model=Dict[str, Any])
def get_dashboard_cashflow_trend(
    workspace_id: int = Query(..., description="ID рабочего пространства"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user)
):
    crud.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    return crud.get_cashflow_trend(db, workspace_id=workspace_id)