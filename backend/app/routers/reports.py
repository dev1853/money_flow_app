# backend/app/routers/reports.py

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional 
from datetime import date

from .. import crud, models, schemas 
from ..dependencies import get_db, get_current_active_user 

router = APIRouter(
    prefix="/reports", # *** ВАЖНО: здесь prefix="/reports"
    tags=["Reports"],
    dependencies=[Depends(get_current_active_user)] 
)

@router.get("/dds", response_model=List[schemas.DDSReportItem])
def get_dds_report(
    workspace_id: int = Query(..., description="ID рабочего пространства"),
    start_date: date = Query(..., description="Начало периода (YYYY-MM-DD)"),
    end_date: date = Query(..., description="Конец периода (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Формирует отчет о движении денежных средств (ДДС) для указанного рабочего пространства и периода.
    """
    crud.workspace.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id) 
    
    report_data = crud.report.get_dds_report_data(
        db, 
        workspace_id=workspace_id, 
        start_date=start_date, 
        end_date=end_date
    )
    return report_data


@router.get("/account-balances", response_model=List[schemas.AccountBalance])
def get_account_balances_report(
    workspace_id: int = Query(..., description="ID рабочего пространства"),
    on_date: Optional[date] = Query(None, description="Дата, на которую нужны остатки (по умолчанию - сегодня)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Возвращает отчет об остатках на счетах на указанную дату.
    """
    crud.workspace.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    
    if on_date is None:
        on_date = date.today()
        
    report_data = crud.report.get_account_balances_report_data(
        db, 
        workspace_id=workspace_id, 
        on_date=on_date
    )
    return report_data