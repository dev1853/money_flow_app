# /backend/app/routers/dashboard.py

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app import crud, models, schemas
# --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
from app.dependencies import get_db, get_current_active_user, get_current_active_workspace

router = APIRouter(
    tags=["dashboard"],
    dependencies=[Depends(get_current_active_user)],
    responses={404: {"description": "Not found"}},
)

@router.get("/summary", response_model=schemas.DashboardSummaryData)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    # --- ИСПОЛЬЗУЕМ ПРАВИЛЬНУЮ ЗАВИСИМОСТЬ ---
    current_workspace: models.Workspace = Depends(get_current_active_workspace),
    start_date: date = Query(..., description="Дата начала периода (ГГГГ-ММ-ДД)"),
    end_date: date = Query(..., description="Дата окончания периода (ГГГГ-ММ-ДД)"),
) -> schemas.DashboardSummaryData:
    """
    Получает сводные данные для дашборда (общий доход, расход, чистый баланс)
    для текущего активного рабочего пространства.
    """
    return crud.crud_dashboard.get_summary_data(
        db=db,
        owner_id=current_user.id,
        workspace_id=current_workspace.id, # Используем ID из правильной зависимости
        start_date=start_date,
        end_date=end_date,
    )

@router.get("/cashflow-trend", response_model=List[schemas.DashboardCashflowTrendData])
def get_dashboard_cashflow_trend(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    # --- ИСПОЛЬЗУЕМ ПРАВИЛЬНУЮ ЗАВИСИМОСТЬ ---
    current_workspace: models.Workspace = Depends(get_current_active_workspace),
    start_date: date = Query(..., description="Дата начала периода (ГГГГ-ММ-ДД)"),
    end_date: date = Query(..., description="Дата окончания периода (ГГГГ-ММ-ДД)"),
    period_type: str = Query("month", description="Тип периода: 'day', 'month', 'quarter', 'year'"),
) -> List[schemas.DashboardCashflowTrendData]:
    """
    Получает данные для графика движения денежных потоков
    для текущего активного рабочего пространства.
    """
    # Этот эндпоинт теперь также защищен и работает в контексте активного воркспейса
    return crud.crud_dashboard.get_cashflow_trend_data(
        db=db,
        workspace_id=current_workspace.id,
        start_date=start_date,
        end_date=end_date,
        period_type=period_type
    )