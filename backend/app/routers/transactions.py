# /backend/app/routers/transactions.py

import logging 
from typing import Any, List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..dependencies import (
    get_db,
    get_current_active_user,
    get_workspace_from_query
)
from ..services.transaction_service import transaction_service
from ..core.exceptions import (
    NotFoundError,
    AccountNotFoundError,
    PermissionDeniedError,
    DdsArticleNotFoundError
)

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["transactions"],
    dependencies=[Depends(get_current_active_user)]
)

@router.get("/", response_model=schemas.TransactionPage) # <-- ИСПОЛЬЗУЕМ ПРАВИЛЬНУЮ СХЕМУ
def read_transactions(
    db: Session = Depends(get_db),
    workspace: models.Workspace = Depends(get_workspace_from_query),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    account_id: Optional[int] = Query(None),
    amount_from: Optional[float] = Query(None, description="Минимальная сумма транзакции"),
    amount_to: Optional[float] = Query(None, description="Максимальная сумма транзакции")
):
    """
    Получить пагинированный список транзакций.
    """
    total_count = crud.transaction.get_count_by_workspace(
        db,
        workspace_id=workspace.id,
        start_date=start_date,
        end_date=end_date,
        account_id=account_id,
        amount_from=amount_from,
        amount_to=amount_to
    )
    transactions = crud.transaction.get_multi_by_workspace(
        db,
        workspace_id=workspace.id,
        skip=skip,
        limit=limit,
        start_date=start_date,
        end_date=end_date,
        account_id=account_id,
        amount_from=amount_from,
        amount_to=amount_to
    )
    # ИСПРАВЛЕНИЕ: Изменяем ключи 'transactions' на 'items' и 'total_count' на 'total'
    return {"items": transactions, "total": total_count}

@router.post("/", response_model=schemas.Transaction, status_code=status.HTTP_201_CREATED)
def create_transaction(
    *,
    db: Session = Depends(get_db),
    transaction_in: schemas.TransactionCreate, # Теперь user_id и workspace_id здесь необязательны
    current_user: models.User = Depends(get_current_active_user),
    workspace: models.Workspace = Depends(get_workspace_from_query),
) -> Any:
    logger.info(
        "Попытка создания транзакции для workspace %d пользователем %s",
        workspace.id,
        current_user.email,
    )
    logger.debug("Входящие данные транзакции: %s", transaction_in.model_dump_json())

    # ИСПРАВЛЕНИЕ: Явно присваиваем user_id и workspace_id, если они не были предоставлены
    if transaction_in.user_id is None: #
        transaction_in.user_id = current_user.id #
    if transaction_in.workspace_id is None: #
        transaction_in.workspace_id = workspace.id #

    # Теперь transaction_in содержит все необходимые поля, и нам не нужно создавать новый объект
    # full_transaction_in, что было причиной TypeError.

    try:
        transaction = transaction_service.create_transaction(
            db=db,
            transaction_in=transaction_in, # Передаем измененную схему
            current_user=current_user,
            workspace_id=workspace.id
        )

        db.commit() 
        db.refresh(transaction) 

        logger.info(
            "Транзакция с ID %d успешно создана для workspace %d.",
            transaction.id,
            workspace.id
        )
        return transaction
    except (AccountNotFoundError, DdsArticleNotFoundError) as e:
        logger.warning(
            "Ошибка создания транзакции (404 - Not Found): %s. Workspace: %d",
            e.detail,
            workspace.id
        )
        db.rollback() 
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.detail)
    except Exception as e:
        logger.error(
            "Непредвиденная ошибка при создании транзакции для workspace %d: %s",
            workspace.id,
            e,
            exc_info=True
        )
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Произошла непредвиденная ошибка.")

@router.put("/{transaction_id}", response_model=schemas.Transaction)
def update_transaction(
    *,
    db: Session = Depends(get_db),
    transaction_id: int,
    transaction_in: schemas.TransactionUpdate,
    current_user: models.User = Depends(get_current_active_user),
    workspace: models.Workspace = Depends(get_workspace_from_query),
) -> Any:
    try:
        transaction_to_update = transaction_service.get_transaction_by_id(
            db, transaction_id=transaction_id, user=current_user, workspace_id=workspace.id
        )
        return transaction_service.update_transaction(
            db, transaction_to_update=transaction_to_update, transaction_in=transaction_in
        )
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.detail)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.detail)
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Произошла непредвиденная ошибка.")

@router.delete("/{transaction_id}", response_model=schemas.Transaction)
def delete_transaction(
    *,
    db: Session = Depends(get_db),
    transaction_id: int,
    current_user: models.User = Depends(get_current_active_user),
    workspace: models.Workspace = Depends(get_workspace_from_query),
) -> Any:
    try:
        transaction_to_delete = transaction_service.get_transaction_by_id(
            db, transaction_id=transaction_id, user=current_user, workspace_id=workspace.id
        )
        return transaction_service.delete_transaction(db, transaction_to_delete=transaction_to_delete)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.detail)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.detail)
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Произошла непредвиденная ошибка.")