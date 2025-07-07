# /backend/app/routers/reports.py

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from app import crud, models, schemas
from app.dependencies import get_db, get_current_active_user, get_current_active_workspace

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
    
@router.get("/profit-loss", response_model=schemas.ProfitLossReport)
def get_profit_loss_report(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    current_workspace: models.Workspace = Depends(get_current_active_workspace),
    start_date: date = Query(..., description="Дата начала периода (ГГГГ-ММ-ДД)"),
    end_date: date = Query(..., description="Дата окончания периода (ГГГГ-ММ-ДД)"),
) -> schemas.ProfitLossReport:
    """
    Получает отчет о прибылях и убытках за выбранный период.
    """
    return crud.report_crud.get_profit_loss_report(
        db=db,
        owner_id=current_user.id,
        workspace_id=current_workspace.id,
        start_date=start_date,
        end_date=end_date
    )