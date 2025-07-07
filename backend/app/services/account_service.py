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
    
    def archive_account(self, db: Session, *, account_to_archive: models.Account) -> models.Account:
        """Архивирует счет (делает его неактивным), выполняя проверку бизнес-правил."""
        
        # 1. Бизнес-логика: нельзя архивировать счет с ненулевым балансом.
        if account_to_archive.balance != Decimal('0.0'):
            raise AccountDeletionError(detail="Нельзя архивировать счет с ненулевым балансом.")

        # 2. В будущем здесь можно добавить проверку на наличие связанных транзакций.
        # В данный момент эта логика обработки транзакций находится в transaction_service.py.
        # Для удаления транзакций со счета, см. transaction_service.py.

        # 3. Обновление статуса is_active на False вместо удаления
        # Создаем схему обновления только для поля is_active
        account_update_data = schemas.AccountUpdate(is_active=False)
        
        # Используем CRUD-метод update для изменения статуса счета
        archived_account = crud.account.update(db=db, db_obj=account_to_archive, obj_in=account_update_data)
        
        # db.commit() и db.refresh() будут выполнены в роутере
        return archived_account

    def delete_account(self, db: Session, *, account_to_delete: models.Account) -> models.Account:
        """Удаляет счет, выполняя проверку бизнес-правил."""
        
        # 1. Бизнес-логика: нельзя удалить счет с ненулевым балансом.
        if account_to_delete.balance != Decimal('0.0'):
            raise AccountDeletionError(detail="Нельзя удалить счет с ненулевым балансом.")

        # 2. В будущем здесь можно добавить проверку на наличие связанных транзакций.

        # 3. Делегирование удаления CRUD-слою
        return crud.account.remove(db=db, id=account_to_delete.id)


account_service = AccountService()