# /backend/app/services/transaction_service.py

import logging
from sqlalchemy.orm import Session
from decimal import Decimal # Убедитесь, что Decimal импортирован

from app import crud, models, schemas
from ..core.exceptions import AccountNotFoundError, PermissionDeniedError, DdsArticleNotFoundError, NotFoundError
from ..schemas import TransactionType

logger = logging.getLogger(__name__)

class TransactionService:
    """Сервис для инкапсуляции бизнес-логики, связанной с транзакциями."""

    def get_transaction_by_id(self, db: Session, *, transaction_id: int, user: models.User, workspace_id: int) -> models.Transaction:
        """Получает транзакцию и проверяет права доступа."""
        transaction = crud.transaction.get(db, id=transaction_id)
        if not transaction:
            raise NotFoundError(resource="Транзакция", resource_id=transaction_id)
        if transaction.workspace_id != workspace_id or transaction.user_id != user.id: # ИСПРАВЛЕНО: user_id вместо created_by_user_id
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
        Создает транзакцию, валидирует права и корректно обновляет балансы счетов.
        Сумма всегда положительна, тип транзакции определяет логику.
        """
        # 1. Проверяем права на воркспейс
        if workspace_id not in [ws.id for ws in current_user.workspaces]:
            raise PermissionDeniedError(detail="Нет доступа к этому рабочему пространству.")

        # 2. Проверяем счета
        from_account, to_account = None, None
        if transaction_in.from_account_id:
            from_account = crud.account.get(db, id=transaction_in.from_account_id)
            logger.debug(f"Получен счет-источник ID {transaction_in.from_account_id}: {from_account}")
            if not from_account or from_account.workspace_id != workspace_id:
                raise AccountNotFoundError(detail=f"Счет-источник с ID {transaction_in.from_account_id} не найден.")
        
        if transaction_in.to_account_id:
            to_account = crud.account.get(db, id=transaction_in.to_account_id)
            logger.debug(f"Получен счет-получатель ID {transaction_in.to_account_id}: {to_account}")
            if not to_account or to_account.workspace_id != workspace_id:
                raise AccountNotFoundError(detail=f"Счет-получатель с ID {transaction_in.to_account_id} не найден.")

        # 3. Валидируем логику по типу транзакции
        logger.debug(f"Тип транзакции: {transaction_in.transaction_type}, to_account: {to_account}, from_account: {from_account}")
        if transaction_in.transaction_type == models.TransactionType.EXPENSE and not from_account:
            raise ValueError("Для расхода должен быть указан счет-источник.")
        if transaction_in.transaction_type == models.TransactionType.INCOME and not to_account:
            raise ValueError("Для дохода должен быть указан счет-получатель.")
        if transaction_in.transaction_type == models.TransactionType.TRANSFER and (not from_account or not to_account):
            raise ValueError("Для перевода должны быть указаны оба счета.")

        # 4. ОБНОВЛЯЕМ БАЛАНСЫ, СУММА ВСЕГДА ПОЛОЖИТЕЛЬНАЯ
        amount = Decimal(abs(transaction_in.amount)) 
        logger.debug(f"Сумма транзакции (Decimal): {amount}") 

        if transaction_in.transaction_type == models.TransactionType.EXPENSE:
            # from_account.balance -= amount # ИСПРАВЛЕНО: Используем crud.account.update_balance
            crud.account.update_balance(db, account_id=from_account.id, amount_change=-amount)
        
        elif transaction_in.transaction_type == models.TransactionType.INCOME:
            # to_account.balance += amount # ИСПРАВЛЕНО: Используем crud.account.update_balance
            crud.account.update_balance(db, account_id=to_account.id, amount_change=amount)

        elif transaction_in.transaction_type == models.TransactionType.TRANSFER:
            # from_account.balance -= amount # ИСПРАВЛЕНО: Используем crud.account.update_balance
            # to_account.balance += amount # ИСПРАВЛЕНО: Используем crud.account.update_balance
            crud.account.update_balance(db, account_id=from_account.id, amount_change=-amount)
            crud.account.update_balance(db, account_id=to_account.id, amount_change=amount)

        # 5. Создаем саму запись о транзакции
        db_transaction = crud.transaction.create_with_owner(
            db, obj_in=transaction_in, owner_id=current_user.id, workspace_id=workspace_id
        )
        
        return db_transaction

    def update_transaction(
        self,
        db: Session,
        *,
        transaction_to_update: models.Transaction, # Оригинальный объект из БД
        transaction_in: schemas.TransactionUpdate # Входящие данные для обновления
    ) -> models.Transaction:
        """
        Атомарно обновляет транзакцию и корректирует балансы счетов.
        """
        try:
            # 1. Захватываем старое состояние транзакции для корректировки балансов
            old_from_account_id = transaction_to_update.from_account_id
            old_to_account_id = transaction_to_update.to_account_id
            old_amount = Decimal(transaction_to_update.amount)
            old_transaction_type = transaction_to_update.transaction_type

            # 2. Обновляем саму запись о транзакции в базе данных
            # crud.transaction.update обновит transaction_to_update in-place
            updated_transaction_db_obj = crud.transaction.update(db, db_obj=transaction_to_update, obj_in=transaction_in)
            
            # 3. Захватываем новое состояние транзакции для применения новых балансов
            new_from_account_id = updated_transaction_db_obj.from_account_id
            new_to_account_id = updated_transaction_db_obj.to_account_id
            new_amount = Decimal(updated_transaction_db_obj.amount)
            new_transaction_type = updated_transaction_db_obj.transaction_type

            # --- Шаг 4: Откатываем влияние старой транзакции на балансы ---
            if old_transaction_type == models.TransactionType.EXPENSE:
                if old_from_account_id:
                    crud.account.update_balance(db, account_id=old_from_account_id, amount_change=old_amount)
            elif old_transaction_type == models.TransactionType.INCOME:
                if old_to_account_id:
                    crud.account.update_balance(db, account_id=old_to_account_id, amount_change=-old_amount)
            elif old_transaction_type == models.TransactionType.TRANSFER:
                if old_from_account_id:
                    crud.account.update_balance(db, account_id=old_from_account_id, amount_change=old_amount)
                if old_to_account_id:
                    crud.account.update_balance(db, account_id=old_to_account_id, amount_change=-old_amount)

            # --- Шаг 5: Применяем влияние новой транзакции на балансы ---
            if new_transaction_type == models.TransactionType.EXPENSE:
                if new_from_account_id:
                    crud.account.update_balance(db, account_id=new_from_account_id, amount_change=-new_amount)
            elif new_transaction_type == models.TransactionType.INCOME:
                if new_to_account_id:
                    crud.account.update_balance(db, account_id=new_to_account_id, amount_change=new_amount)
            elif new_transaction_type == models.TransactionType.TRANSFER:
                if new_from_account_id:
                    crud.account.update_balance(db, account_id=new_from_account_id, amount_change=-new_amount)
                if new_to_account_id:
                    crud.account.update_balance(db, account_id=new_to_account_id, amount_change=new_amount)

            db.commit()
            db.refresh(updated_transaction_db_obj)
            return updated_transaction_db_obj
        except Exception as e: # ИСПРАВЛЕНО: Логируем ошибку для диагностики
            logger.error(f"Ошибка при обновлении транзакции ID {transaction_to_update.id}: {e}", exc_info=True)
            db.rollback()
            raise

    def delete_transaction(self, db: Session, *, transaction_to_delete: models.Transaction) -> models.Transaction:
        """
        Атомарно удаляет транзакцию и откатывает ее влияние на баланс.
        """
        try:
            # Определяем сумму и счета для отката
            amount = Decimal(transaction_to_delete.amount)
            
            if transaction_to_delete.transaction_type == models.TransactionType.EXPENSE:
                if transaction_to_delete.from_account_id:
                    crud.account.update_balance(db, account_id=transaction_to_delete.from_account_id, amount_change=amount) # Возвращаем сумму на счет-источник
            elif transaction_to_delete.transaction_type == models.TransactionType.INCOME:
                if transaction_to_delete.to_account_id:
                    crud.account.update_balance(db, account_id=transaction_to_delete.to_account_id, amount_change=-amount) # Вычитаем сумму со счета-получателя
            elif transaction_to_delete.transaction_type == models.TransactionType.TRANSFER:
                if transaction_to_delete.from_account_id:
                    crud.account.update_balance(db, account_id=transaction_to_delete.from_account_id, amount_change=amount) # Возвращаем на счет-источник
                if transaction_to_delete.to_account_id:
                    crud.account.update_balance(db, account_id=transaction_to_delete.to_account_id, amount_change=-amount) # Вычитаем со счета-получателя
            
            # Удаляем саму транзакцию
            crud.transaction.remove(db, id=transaction_to_delete.id)
            
            db.commit()
            return transaction_to_delete
        except Exception as e: # ИСПРАВЛЕНО: Логируем ошибку для диагностики
            logger.error(f"Ошибка при удалении транзакции ID {transaction_to_delete.id}: {e}", exc_info=True)
            db.rollback()
            raise

# Создаем единственный экземпляр сервиса
transaction_service = TransactionService()