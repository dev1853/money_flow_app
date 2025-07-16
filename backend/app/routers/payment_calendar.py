# /backend/app/routers/payment_calendar.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date

from ..dependencies import get_db, get_current_active_user, get_workspace_from_query
from ..services.payment_calendar_service import payment_calendar_service
from .. import models

router = APIRouter(
    tags=["payment-calendar"],
    dependencies=[Depends(get_current_active_user)],
)

@router.get("/")
def get_payment_calendar(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    workspace: models.Workspace = Depends(get_workspace_from_query),
):
    """
    Получить данные для построения платежного календаря.
    """
    return payment_calendar_service.generate_calendar(
        db=db,
        workspace_id=workspace.id,
        start_date=start_date,
        end_date=end_date
    )