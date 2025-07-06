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
    get_current_active_workspace
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
    workspace: models.Workspace = Depends(get_current_active_workspace),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    account_id: Optional[int] = Query(None)
):
    """
    Получить пагинированный список транзакций.
    """
    total_count = crud.transaction.get_count_by_workspace(
        db,
        workspace_id=workspace.id,
        start_date=start_date,
        end_date=end_date,
        account_id=account_id
    )
    transactions = crud.transaction.get_multi_by_workspace(
        db,
        workspace_id=workspace.id,
        skip=skip,
        limit=limit,
        start_date=start_date,
        end_date=end_date,
        account_id=account_id
    )
    return {"transactions": transactions, "total_count": total_count}

@router.post("/", response_model=schemas.Transaction, status_code=status.HTTP_201_CREATED)
def create_transaction(
    *,
    db: Session = Depends(get_db),
    transaction_in: schemas.TransactionCreate,
    current_user: models.User = Depends(get_current_active_user),
    current_workspace: models.Workspace = Depends(get_current_active_workspace),
) -> Any:
    logger.info(
        "Попытка создания транзакции для workspace %d пользователем %s",
        current_workspace.id,
        current_user.email,
    )
    logger.debug("Входящие данные транзакции: %s", transaction_in.model_dump_json())

    try:
        transaction = transaction_service.create_transaction(
            db=db,
            transaction_in=transaction_in,
            current_user=current_user,
            workspace_id=current_workspace.id
        )
        
        # *** УБЕДИСЬ, ЧТО ЭТИ ДВЕ СТРОКИ ПРИСУТСТВУЮТ! ***
        db.commit() 
        db.refresh(transaction) 

        logger.info(
            "Транзакция с ID %d успешно создана для workspace %d.",
            transaction.id,
            current_workspace.id
        )
        return transaction
    except (AccountNotFoundError, DdsArticleNotFoundError) as e:
        logger.warning(
            "Ошибка создания транзакции (404 - Not Found): %s. Workspace: %d",
            e.detail,
            current_workspace.id
        )
        db.rollback() 
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.detail)
    except Exception as e:
        logger.error(
            "Непредвиденная ошибка при создании транзакции для workspace %d: %s",
            current_workspace.id,
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
    current_workspace: models.Workspace = Depends(get_current_active_workspace),
) -> Any:
    try:
        transaction_to_update = transaction_service.get_transaction_by_id(
            db, transaction_id=transaction_id, user=current_user, workspace_id=current_workspace.id
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
    current_workspace: models.Workspace = Depends(get_current_active_workspace),
) -> Any:
    try:
        transaction_to_delete = transaction_service.get_transaction_by_id(
            db, transaction_id=transaction_id, user=current_user, workspace_id=current_workspace.id
        )
        return transaction_service.delete_transaction(db, transaction_to_delete=transaction_to_delete)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.detail)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.detail)
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Произошла непредвиденная ошибка.")