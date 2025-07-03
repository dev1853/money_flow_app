# /backend/app/routers/statement.py

from typing import Any
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..dependencies import get_db, get_current_active_user
# Импортируем наш новый сервис для обработки выписок
from ..services.statement_service import statement_service

router = APIRouter(
    tags=["statement"],
    dependencies=[Depends(get_current_active_user)]
)

@router.post("/upload", response_model=schemas.StatementUploadResponse)
def upload_statement(
    *,
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
    account_id: int = Form(...),
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """
    Загружает и обрабатывает банковскую выписку.

    - **file**: Файл выписки (например, в формате CSV).
    - **account_id**: ID счета, к которому относятся транзакции.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неподдерживаемый формат файла. Пожалуйста, загрузите CSV.",
        )
        
    try:
        # Вся сложная логика делегирована сервисному слою
        created_transactions = statement_service.process_statement(
            db=db,
            file=file,
            account_id=account_id,
            user=current_user
        )
        
        return {
            "message": "Выписка успешно обработана.",
            "created_transactions_count": len(created_transactions),
            "created_transactions": created_transactions,
        }
    except HTTPException as e:
        # Пробрасываем HTTP исключения из сервиса
        raise e
    except Exception as e:
        # Логируем непредвиденные ошибки
        # logger.error(f"Failed to process statement: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Произошла внутренняя ошибка при обработке файла: {e}",
        )