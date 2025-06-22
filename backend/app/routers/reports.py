# backend/app/routers/reports.py

from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import crud, schemas, models
from app.dependencies import get_db, get_current_active_user
from datetime import date

router = APIRouter(
    tags=["reports"],
    responses={404: {"description": "Not found"}},
)

@router.get("/dds", response_model=List[schemas.DdsReportItem])
def get_dds_report(
    *,
    db: Session = Depends(get_db),
    workspace_id: int = Query(..., description="ID рабочего пространства"),
    start_date: date = Query(..., description="Дата начала периода (ГГГГ-ММ-ДД)"),
    end_date: date = Query(..., description="Дата окончания периода (ГГГГ-ММ-ДД)"),
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """
    Формирует Отчет о движении денежных средств (ДДС) для указанного рабочего пространства и периода.
    """
    # Проверяем, что рабочее пространство принадлежит текущему пользователю
    crud.workspace.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    
    # ИЗМЕНЕНО: Заменяем crud.report на crud.report_crud
    return crud.report_crud.get_dds_report( # <--- ИСПРАВЛЕНО ЗДЕСЬ!
        db=db,
        owner_id=current_user.id,
        workspace_id=workspace_id,
        start_date=start_date,
        end_date=end_date
    )

@router.get("/account-balances", response_model=List[schemas.AccountBalance])
def get_account_balances_report(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    workspace_id: int = Query(..., description="ID рабочего пространства")
) -> Any:
    """
    Получает отчет по текущим балансам счетов для рабочего пространства.
    """
    # Проверяем, что рабочее пространство принадлежит текущему пользователю
    crud.workspace.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    
    accounts = crud.account.get_multi_by_owner_and_workspace(
        db=db, owner_id=current_user.id, workspace_id=workspace_id
    )
    
    # Форматируем данные для ответа
    report_data = []
    for account in accounts:
        report_data.append(schemas.AccountBalance(
            account_id=account.id,
            account_name=account.name,
            balance=account.current_balance
        ))
    
    return report_data