# /backend/app/routers/reports.py

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional 
from datetime import date
from enum import Enum

from app import crud, models, schemas
from app.dependencies import get_db, get_current_active_user, get_current_active_workspace

class PeriodType(str, Enum):
    DAY = "day"
    MONTH = "month"
    QUARTER = "quarter"
    YEAR = "year"
    
router = APIRouter(
    tags=["reports"],
    dependencies=[Depends(get_current_active_user)],
    responses={404: {"description": "Not found"}},
)

@router.get("/dds", response_model=List[schemas.DdsReportItem])
def get_dds_report(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    current_workspace: models.Workspace = Depends(get_current_active_workspace),
    start_date: date = Query(..., description="Дата начала периода (ГГГГ-ММ-ДД)"),
    end_date: date = Query(..., description="Дата окончания периода (ГГГГ-ММ-ДД)"),
):
    """
    Получает отчет ДДС (Движение Денежных Средств) по статьям за выбранный период.
    """
    return crud.report_crud.get_dds_report(
        db=db,
        owner_id=current_user.id, # Убедитесь, что owner_id передается
        workspace_id=current_workspace.id,
        start_date=start_date,
        end_date=end_date
    )
    
@router.get("/profit-loss", response_model=schemas.ProfitLossReport) # <-- Или изменится на List[schemas.ProfitLossPeriodItem]
def get_profit_loss_report(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    current_workspace: models.Workspace = Depends(get_current_active_workspace),
    start_date: date = Query(..., description="Дата начала периода (ГГГГ-ММ-ДД)"),
    end_date: date = Query(..., description="Дата окончания периода (ГГГГ-ММ-ДД)"),
    # <-- НОВЫЕ ПАРАМЕТРЫ ЗАПРОСА
    period_type: Optional[PeriodType] = Query(
        None, 
        description="Тип агрегации отчета (например, 'month', 'quarter', 'year'). По умолчанию - за весь период."
    ),
    compare_to_previous_period: Optional[bool] = Query(
        False, 
        description="Включить сравнение с предыдущим аналогичным периодом."
    ),
    account_ids: Optional[List[int]] = Query(
        None, 
        description="Список ID счетов для фильтрации отчета. Если не указан, включаются все счета."
    )
) -> schemas.ProfitLossReport: # Тип ответа может потребовать изменений в схеме ProfitLossReport
    """
    Получает отчет о прибылях и убытках за выбранный период с возможностью агрегации и сравнения.
    """
    return crud.report_crud.get_profit_loss_report(
        db=db,
        owner_id=current_user.id,
        workspace_id=current_workspace.id,
        start_date=start_date,
        end_date=end_date,
        # <-- ПЕРЕДАЕМ НОВЫЕ ПАРАМЕТРЫ В CRUD
        period_type=period_type,
        compare_to_previous_period=compare_to_previous_period,
        account_ids=account_ids
    )
