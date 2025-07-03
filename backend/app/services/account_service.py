# /backend/app/services/account_service.py

from sqlalchemy.orm import Session
from .. import crud, models, schemas
from ..core.exceptions import PermissionDeniedError # Используем наше стандартное исключение

class AccountService:
    def create_account(
        self,
        db: Session,
        *,
        account_in: schemas.AccountCreate,
        user_id: int
    ) -> models.Account:
        """
        Создает счет, предварительно проверив права на рабочее пространство.
        """
        # Проверка прав доступа к рабочему пространству
        workspace = crud.workspace.get(db, id=account_in.workspace_id)
        if not workspace or workspace.owner_id != user_id:
            # Выбрасываем наше стандартное бизнес-исключение
            raise PermissionDeniedError() 

        try:
            # Убедимся, что CRUD не делает commit самостоятельно
            account = crud.account.create_with_owner_and_workspace(
                db=db, obj_in=account_in, owner_id=user_id, workspace_id=account_in.workspace_id
            )
            db.commit()
            db.refresh(account)
            return account
        except Exception:
            db.rollback()
            raise

account_service = AccountService()