# /backend/app/services/transaction_service.py

from sqlalchemy.orm import Session
from decimal import Decimal

from .. import crud, models, schemas
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
        # ... (код из предыдущего шага без изменений) ...
        # 1. Проверка прав и существования связанных сущностей
        account = crud.account.get(db, id=transaction_in.account_id)
        if not account:
            raise AccountNotFoundError(account_id=transaction_in.account_id)
        if account.workspace_id != workspace_id or account.owner_id != current_user.id:
            raise PermissionDeniedError()
        if transaction_in.dds_article_id:
            article = crud.dds_article.get(db, id=transaction_in.dds_article_id)
            if not article or article.workspace_id != workspace_id:
                raise DdsArticleNotFoundError(dds_article_id=transaction_in.dds_article_id)
        try:
            # 2. Создание объекта транзакции
            transaction = crud.transaction.create_with_owner_and_workspace(db, obj_in=transaction_in, owner_id=current_user.id, workspace_id=workspace_id)
            # 3. Обновление баланса счета
            amount_to_update = Decimal(transaction.amount)
            if transaction.transaction_type == TransactionType.EXPENSE:
                amount_to_update = -amount_to_update
            crud.account.update_balance(db, account_id=account.id, amount_change=amount_to_update)
            # 4. Фиксация транзакции
            db.commit()
            # 5. Обновление объекта для response
            db.refresh(transaction)
            return transaction
        except Exception:
            db.rollback()
            raise

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