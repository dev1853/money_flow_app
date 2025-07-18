# /backend/app/routers/dashboard.py

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app import crud, models, schemas
from app.dependencies import get_db, get_current_active_user, get_workspace_from_query

router = APIRouter(
    tags=["dashboard"],
    dependencies=[Depends(get_current_active_user)],
    responses={404: {"description": "Not found"}},
)

@router.get("/summary", response_model=schemas.DashboardSummaryData)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    workspace: models.Workspace = Depends(get_workspace_from_query),
    start_date: date = Query(..., description="Дата начала периода (ГГГГ-ММ-ДД)"),
    end_date: date = Query(..., description="Дата окончания периода (ГГГГ-ММ-ДД)"),
) -> schemas.DashboardSummaryData:
    """
    Получает сводные данные для дашборда (общий доход, расход, чистый баланс)
    для текущего активного рабочего пространства.
    """
    return crud.dashboard_crud.get_summary_data( # ИСПРАВЛЕНО: Используем экземпляр dashboard_crud
        db=db,
        owner_id=current_user.id,
        workspace_id=workspace.id,
        start_date=start_date,
        end_date=end_date,
    )

@router.get("/cashflow-trend", response_model=List[schemas.DashboardCashflowTrendData])
def get_dashboard_cashflow_trend(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    workspace: models.Workspace = Depends(get_workspace_from_query),
    start_date: date = Query(..., description="Дата начала периода (ГГГГ-ММ-ДД)"),
    end_date: date = Query(..., description="Дата окончания периода (ГГГГ-ММ-ДД)"),
    period_type: str = Query("month", description="Тип периода: 'day', 'month', 'quarter', 'year'"),
) -> List[schemas.DashboardCashflowTrendData]:
    """
    Получает данные для графика движения денежных потоков
    для текущего активного рабочего пространства.
    """
    return crud.dashboard_crud.get_cashflow_trend_by_period( # ИСПРАВЛЕНО: Изменено имя метода и используется экземпляр dashboard_crud
        db=db,
        workspace_id=workspace.id,
        owner_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        period_type=period_type
    )

@router.get("/expenses-by-counterparties")
def get_expenses_by_counterparties(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    workspace: models.Workspace = Depends(get_workspace_from_query),
    start_date: date = Query(..., description="Дата начала периода (ГГГГ-ММ-ДД)"),
    end_date: date = Query(..., description="Дата окончания периода (ГГГГ-ММ-ДД)")
):
    """
    Получает расходы по контрагентам за выбранный период.
    """
    return crud.report_crud.get_expenses_by_counterparty(
        db=db,
        owner_id=current_user.id,
        workspace_id=workspace.id,
        start_date=start_date,
        end_date=end_date
    )