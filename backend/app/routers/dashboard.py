# backend/app/routers/dashboard.py

from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import date # Добавляем импорт date

from app import crud, schemas, models
from app.dependencies import get_db, get_current_active_user

router = APIRouter(
    tags=["dashboard"],
    responses={404: {"description": "Not found"}},
)

# Эндпоинт для получения сводных данных дашборда
@router.get("/summary", response_model=schemas.DashboardSummaryData)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    workspace_id: int = Query(..., description="ID рабочего пространства"),
    start_date: date = Query(None, description="Дата начала периода (ГГГГ-ММ-ДД)"),
    end_date: date = Query(None, description="Дата окончания периода (ГГГГ-ММ-ДД)"),
) -> Any:
    """
    Получает сводные данные (общий доход, общий расход, чистая прибыль) для дашборда.
    """
    # Проверка принадлежности рабочего пространства
    crud.workspace.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    
    # Если даты не указаны, используем текущий месяц как период по умолчанию
    if not start_date or not end_date:
        today = date.today()
        start_date = date(today.year, today.month, 1)
        end_date = today

    return crud.dashboard_crud.get_summary_data(
        db=db,
        owner_id=current_user.id,
        workspace_id=workspace_id,
        start_date=start_date,
        end_date=end_date
    )

# Эндпоинт для получения данных тренда денежных потоков
@router.get("/cashflow-trend", response_model=List[schemas.DashboardCashflowTrendData])
def get_dashboard_cashflow_trend(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    workspace_id: int = Query(..., description="ID рабочего пространства"),
    start_date: date = Query(None, description="Дата начала периода (ГГГГ-ММ-ДД)"),
    end_date: date = Query(None, description="Дата окончания периода (ГГГГ-ММ-ДД)"),
    interval: str = Query("day", description="Интервал группировки (day, month, year)"),
) -> Any:
    """
    Получает данные для графика тренда денежных потоков по дням/месяцам/годам.
    """
    # Проверка принадлежности рабочего пространства
    crud.workspace.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)

    # Если даты не указаны, используем текущий год как период по умолчанию
    if not start_date or not end_date:
        today = date.today()
        start_date = date(today.year, 1, 1)
        end_date = today

    return crud.dashboard_crud.get_cashflow_trend_data(
        db=db,
        owner_id=current_user.id,
        workspace_id=workspace_id,
        start_date=start_date,
        end_date=end_date,
        interval=interval
    )