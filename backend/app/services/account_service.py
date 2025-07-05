# app/services/account_service.py
from sqlalchemy.orm import Session
from decimal import Decimal

from app import crud, models, schemas
from app.core.exceptions import PermissionDeniedError, AccountDeletionError

class AccountService:
    def create_account(
        self, db: Session, *, account_in: schemas.AccountCreate, user_id: int
    ) -> models.Account:
        """Создает счет, проверяя права на рабочее пространство."""
        workspace = crud.workspace.get(db, id=account_in.workspace_id)
        if not workspace or workspace.owner_id != user_id:
            raise PermissionDeniedError(detail="Нет прав для этого рабочего пространства.")
        
        account = crud.account.create_with_owner(
            db, obj_in=account_in, owner_id=user_id
        )
        return account

    def delete_account(self, db: Session, *, account_to_delete: models.Account) -> models.Account:
        """Удаляет счет, выполняя проверку бизнес-правил."""
        
        # 1. Бизнес-логика: нельзя удалить счет с ненулевым балансом.
        if account_to_delete.balance != Decimal('0.0'):
            raise AccountDeletionError(detail="Нельзя удалить счет с ненулевым балансом.")

        # 2. В будущем здесь можно добавить проверку на наличие связанных транзакций.

        # 3. Делегирование удаления CRUD-слою
        return crud.account.remove(db=db, id=account_to_delete.id)


account_service = AccountService()