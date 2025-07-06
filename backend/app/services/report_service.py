# /app/services/report_service.py

from typing import Any, List, Dict
from datetime import date
from sqlalchemy.orm import Session
from .. import crud, models, schemas
from ..core.exceptions import PermissionDeniedError

class ReportService:
    """Сервисный слой для генерации отчетов."""

    def _validate_workspace_access(self, db: Session, *, workspace_id: int, user: models.User):
        """Проверяет, имеет ли пользователь доступ к воркспейсу."""
        workspace = crud.workspace.get(db, id=workspace_id)
        if not workspace or workspace.owner_id != user.id:
            raise PermissionDeniedError(detail="У вас нет доступа к этому рабочему пространству.")

    def generate_dds_report(
        self, db: Session, *, workspace_id: int, start_date: date, end_date: date, user: models.User
    ) -> List[Dict[str, Any]]:
        """Формирует отчет ДДС."""
        self._validate_workspace_access(db, workspace_id=workspace_id, user=user)
        return crud.report.get_dds_report(
            db=db, workspace_id=workspace_id, start_date=start_date, end_date=end_date
        )

    def generate_pnl_report(
        self, db: Session, *, workspace_id: int, start_date: date, end_date: date, user: models.User
    ) -> schemas.ProfitLossReport:
        """Формирует отчет о прибылях и убытках (ОПиУ)."""
        self._validate_workspace_access(db, workspace_id=workspace_id, user=user)
        return crud.report.get_profit_and_loss_report(
            db=db, workspace_id=workspace_id, start_date=start_date, end_date=end_date
        )
        
    def generate_account_balances_report(
        self, db: Session, *, workspace_id: int, user: models.User
    ) -> List[schemas.AccountBalance]:
        """Формирует отчет по балансам счетов."""
        self._validate_workspace_access(db, workspace_id=workspace_id, user=user)
        accounts = crud.account.get_multi_by_owner_and_workspace(
            db=db, owner_id=user.id, workspace_id=workspace_id
        )
        return [
            schemas.AccountBalance(
                account_id=acc.id,
                account_name=acc.name,
                balance=acc.current_balance
            ) for acc in accounts
        ]

report_service = ReportService()