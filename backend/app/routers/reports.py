# backend/app/routers/reports.py

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import date

from app.dependencies import get_db, get_current_active_user
from app.models import User, Transaction
from app.crud.crud_report import report as crud_report


from app.schemas import DdsReportEntry, BaseModel 

router = APIRouter(
    tags=["Reports"],
    dependencies=[Depends(get_current_active_user)]
)

@router.get("/dds", response_model=List[DdsReportEntry])
async def get_dds_report(
    start_date: date = Query(...),
    end_date: date = Query(...),
    workspace_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    report_data = crud_report.get_dds_report_data(
        db,
        workspace_id=workspace_id,
        start_date=start_date,
        end_date=end_date
    )
    return report_data