# backend/app/routers/reports.py

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import date

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional 
from datetime import date
from .. import crud, models, schemas 
from ..dependencies import get_db, get_current_active_user, get_workspace_for_user

router = APIRouter(
    tags=["Reports"],
    dependencies=[Depends(get_current_active_user)]
)

@router.get("/dds", response_model=List[schemas.DdsReportItem])
def get_dds_report(
    start_date: date,
    end_date: date,
    *,
    db: Session = Depends(get_db),
    # Используем нашу зависимость для проверки прав
    workspace: models.Workspace = Depends(get_workspace_for_user),
):
    """
    Формирует отчет о движении денежных средств (ДДС).
    """
    return crud.report.get_dds_report_data(
        db, workspace_id=workspace.id, start_date=start_date, end_date=end_date
    )