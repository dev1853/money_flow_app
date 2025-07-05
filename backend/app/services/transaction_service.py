# /backend/app/services/transaction_service.py

from sqlalchemy.orm import Session
from decimal import Decimal

from app import crud, models, schemas
from ..core.exceptions import AccountNotFoundError, PermissionDeniedError, DdsArticleNotFoundError, NotFoundError
from ..schemas import TransactionType

class TransactionService:
    """Сервис для инкапсуляции бизнес-логики, связанной с транзакциями."""

    def get_transaction_by_id(self, db: Session, *, transaction_id: int, user: models.User, workspace_id: int) -> models.Transaction:
        """Получает транзакцию и проверяет права доступа."""
        transaction = crud.transaction.get(db, id=transaction_id)
        if not transaction:
            raise NotFoundError(resource="Транзакция", resource_id=transaction_id)
        if transaction.workspace_id != workspace_id or transaction.created_by_user_id != user.id:
            raise PermissionDeniedError()
        return transaction

    def create_transaction(
        self, 
        db: Session, 
        *, 
        transaction_in: schemas.TransactionCreate, 
        current_user: models.User, 
        workspace_id: int
    ) -> models.Transaction:
        """
        Создает транзакцию, валидирует права и обновляет балансы счетов.
        """
        # 1. Проверяем, что указанный воркспейс принадлежит пользователю
        if workspace_id not in [ws.id for ws in current_user.workspaces]:
             raise PermissionDeniedError(detail="Нет доступа к этому рабочему пространству.")

        # 2. Проверяем права на счета и их существование
        from_account, to_account = None, None
        if transaction_in.from_account_id:
            from_account = crud.account.get(db, id=transaction_in.from_account_id)
            if not from_account or from_account.workspace_id != workspace_id:
                raise AccountNotFoundError(detail=f"Счет-источник с ID {transaction_in.from_account_id} не найден.")
        
        if transaction_in.to_account_id:
            to_account = crud.account.get(db, id=transaction_in.to_account_id)
            if not to_account or to_account.workspace_id != workspace_id:
                raise AccountNotFoundError(detail=f"Счет-получатель с ID {transaction_in.to_account_id} не найден.")

        # 3. Валидация логики по типу транзакции
        if transaction_in.transaction_type == TransactionType.EXPENSE and not from_account:
            raise ValueError("Для расхода должен быть указан счет-источник.")
        if transaction_in.transaction_type == TransactionType.INCOME and not to_account:
            raise ValueError("Для дохода должен быть указан счет-получатель.")
        if transaction_in.transaction_type == TransactionType.TRANSFER and (not from_account or not to_account):
            raise ValueError("Для перевода должны быть указаны оба счета.")

        # 4. Обновляем балансы
        amount = transaction_in.amount
        if from_account:
            from_account.balance -= amount
            db.add(from_account)
        if to_account:
            to_account.balance += amount
            db.add(to_account)

        # 5. Создаем транзакцию через CRUD
        db_transaction = crud.transaction.create_with_owner(
            db, obj_in=transaction_in, owner_id=current_user.id, workspace_id=workspace_id
        )
        # Коммит и refresh будут выполнены в роутере
        return db_transaction

    # --- НОВЫЙ МЕТОД ДЛЯ ОБНОВЛЕНИЯ ---
    def update_transaction(
        self,
        db: Session,
        *,
        transaction_to_update: models.Transaction,
        transaction_in: schemas.TransactionUpdate
    ) -> models.Transaction:
        """
        Атомарно обновляет транзакцию и корректирует баланс счета.
        """
        try:
            # 1. Рассчитываем сумму для отката старой транзакции
            old_amount = Decimal(transaction_to_update.amount)
            if transaction_to_update.transaction_type == TransactionType.EXPENSE:
                old_amount = -old_amount
            
            # 2. Обновляем саму транзакцию
            updated_transaction = crud.transaction.update(db, db_obj=transaction_to_update, obj_in=transaction_in)

            # 3. Рассчитываем новую сумму
            new_amount = Decimal(updated_transaction.amount)
            if updated_transaction.transaction_type == TransactionType.EXPENSE:
                new_amount = -new_amount

            # 4. Корректируем баланс счета: отменяем старую сумму и применяем новую
            balance_change = new_amount - old_amount
            crud.account.update_balance(db, account_id=updated_transaction.account_id, amount_change=balance_change)
            
            db.commit()
            db.refresh(updated_transaction)
            return updated_transaction
        except Exception:
            db.rollback()
            raise

    # --- НОВЫЙ МЕТОД ДЛЯ УДАЛЕНИЯ ---
    def delete_transaction(self, db: Session, *, transaction_to_delete: models.Transaction) -> models.Transaction:
        """
        Атомарно удаляет транзакцию и откатывает ее влияние на баланс.
        """
        try:
            # 1. Определяем сумму для отката
            amount_to_revert = Decimal(transaction_to_delete.amount)
            if transaction_to_delete.transaction_type == TransactionType.EXPENSE:
                amount_to_revert = -amount_to_revert

            # 2. Обновляем баланс, возвращая его в состояние до транзакции
            crud.account.update_balance(db, account_id=transaction_to_delete.account_id, amount_change=-amount_to_revert)
            
            # 3. Удаляем транзакцию
            crud.transaction.remove(db, id=transaction_to_delete.id)
            
            db.commit()
            # Возвращаем удаленный объект, чтобы показать его в ответе API
            return transaction_to_delete
        except Exception:
            db.rollback()
            raise

# Создаем единственный экземпляр сервиса
transaction_service = TransactionService()