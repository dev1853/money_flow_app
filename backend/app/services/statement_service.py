# /backend/app/services/statement_service.py

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session
import pandas as pd
from typing import List
from decimal import Decimal
from datetime import datetime

from .. import crud, models, schemas
# Импортируем transaction_service, чтобы использовать его атомарную логику
from .transaction_service import transaction_service

class StatementService:
    def process_statement(
        self,
        db: Session,
        *,
        file: UploadFile,
        account_id: int,
        user: models.User
    ) -> List[models.Transaction]:
        """
        Обрабатывает загруженный файл выписки, создает транзакции и применяет правила.
        """
        if not user.active_workspace_id:
            raise HTTPException(status_code=400, detail="Активное рабочее пространство не выбрано.")
        
        workspace_id = user.active_workspace_id

        # Проверяем права на счет
        account = crud.account.get(db, id=account_id)
        if not account or account.workspace_id != workspace_id or account.owner_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ к счету запрещен.")
        
        try:
            # Чтение и парсинг файла (пример для CSV)
            # В реальном приложении здесь будет более сложная логика
            # для определения формата и маппинга колонок.
            df = pd.read_csv(file.file)
            
            created_transactions: List[models.Transaction] = []
            
            # TODO: В будущем маппинг колонок должен настраиваться пользователем
            # date_col, description_col, amount_col ...
            
            for _, row in df.iterrows():
                if pd.isna(row.get("description")) or pd.isna(row.get("amount")):
                    continue

                description = str(row.get("description", ""))
                amount = abs(Decimal(str(row.get("amount", 0))))
                
                # Простая логика определения типа транзакции
                transaction_type = schemas.TransactionType.INCOME if Decimal(str(row.get("amount", 0))) > 0 else schemas.TransactionType.EXPENSE
                
                # Авто-категоризация
                dds_article_id = crud.mapping_rule.find_matching_dds_article_id(
                    db, workspace_id=workspace_id, description=description, transaction_type=transaction_type
                )

                transaction_in = schemas.TransactionCreate(
                    transaction_date=pd.to_datetime(row.get("date")).date(),
                    amount=amount,
                    description=description,
                    transaction_type=transaction_type,
                    account_id=account.id,
                    dds_article_id=dds_article_id
                )
                
                # Используем наш атомарный сервис для создания каждой транзакции
                transaction = transaction_service.create_transaction(
                    db, transaction_in=transaction_in, current_user=user, workspace_id=workspace_id
                )
                created_transactions.append(transaction)
            
            # Commit для каждой транзакции уже происходит внутри transaction_service
            return created_transactions

        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Ошибка обработки файла: {e}")

statement_service = StatementService()