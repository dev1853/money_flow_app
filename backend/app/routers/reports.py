# backend/app/routers/reports.py
from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.dependencies import get_db, get_current_active_user, get_workspace_for_user

router = APIRouter(tags=["Reports"], dependencies=[Depends(get_current_active_user)])

@router.get("/dds", response_model=List[schemas.DdsReportItem])
def get_dds_report(
    start_date: date,
    end_date: date,
    *,
    db: Session = Depends(get_db),
    workspace: models.Workspace = Depends(get_workspace_for_user),
):
    # Зависимость уже проверила права на воркспейс
    return crud.report.get_dds_report_data(
        db, workspace_id=workspace.id, start_date=start_date, end_date=end_date
    )

@router.get("/account-balances", response_model=List[schemas.AccountBalance])
def get_account_balances_report(
    *,
    on_date: Optional[date] = None,
    db: Session = Depends(get_db),
    workspace: models.Workspace = Depends(get_workspace_for_user),
):
    # Зависимость уже проверила права на воркспейс
    return crud.report.get_account_balances_report_data(
        db, workspace_id=workspace.id, on_date=on_date
    )