from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from typing import Optional

from .. import crud, models, schemas, auth_utils
from ..database import get_db

router = APIRouter(
    prefix="/api/reports",
    tags=["Reports"],
    dependencies=[Depends(auth_utils.get_current_active_user)]
)

@router.get("/dds", response_model=List[schemas.DDSReportItem])
def get_dds_report(
    workspace_id: int = Query(..., description="ID рабочего пространства"),
    start_date: date = Query(..., description="Начало периода"),
    end_date: date = Query(..., description="Конец периода"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user)
):
    """
    Формирует отчет о движении денежных средств (ДДС).
    """
    crud.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    report_data = crud.get_dds_report_data(db, start_date=start_date, end_date=end_date, workspace_id=workspace_id)
    return report_data


@router.get("/account-balances", response_model=List[schemas.AccountBalance])
def get_account_balances_report(
    workspace_id: int = Query(..., description="ID рабочего пространства"),
    on_date: Optional[date] = Query(None, description="Дата, на которую нужны остатки (по умолчанию - сегодня)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user)
):
    """
    Возвращает отчет об остатках на счетах на указанную дату.
    """
    crud.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    if on_date is None:
        on_date = date.today()
    return crud.get_account_balances(db=db, on_date=on_date, workspace_id=workspace_id)