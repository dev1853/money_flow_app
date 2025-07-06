# /app/routers/reports.py

from typing import Any, List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..dependencies import get_db, get_current_active_user
from ..services.report_service import report_service
from ..core.exceptions import PermissionDeniedError

router = APIRouter(
    tags=["reports"],
    responses={404: {"description": "Not found"}},
)

@router.get("/dds", response_model=List[schemas.DdsReportItem])
def get_dds_report(
    *,
    db: Session = Depends(get_db),
    workspace_id: int = Query(..., description="ID рабочего пространства"),
    start_date: date = Query(..., description="Дата начала периода"),
    end_date: date = Query(..., description="Дата окончания периода"),
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Формирует Отчет о движении денежных средств (ДДС)."""
    try:
        return report_service.generate_dds_report(
            db=db, workspace_id=workspace_id, start_date=start_date, end_date=end_date, user=current_user
        )
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.detail)

@router.get("/pnl", response_model=schemas.ProfitLossReport)
def get_profit_and_loss_report(
    *,
    db: Session = Depends(get_db),
    workspace_id: int = Query(..., description="ID рабочего пространства"),
    start_date: date = Query(..., description="Дата начала периода"),
    end_date: date = Query(..., description="Дата окончания периода"),
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Формирует Отчет о прибылях и убытках (ОПиУ)."""
    try:
        return report_service.generate_pnl_report(
            db=db, workspace_id=workspace_id, start_date=start_date, end_date=end_date, user=current_user
        )
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.detail)

@router.get("/account-balances", response_model=List[schemas.AccountBalance])
def get_account_balances_report(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    workspace_id: int = Query(..., description="ID рабочего пространства")
) -> Any:
    """Получает отчет по текущим балансам счетов."""
    try:
        return report_service.generate_account_balances_report(
            db=db, workspace_id=workspace_id, user=current_user
        )
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.detail)