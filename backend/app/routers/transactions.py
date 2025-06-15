from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from .. import crud, models, schemas, auth_utils
from ..database import get_db

router = APIRouter(
    prefix="/api/transactions",
    tags=["Transactions"],
    dependencies=[Depends(auth_utils.get_current_active_user)]
)

@router.post("", response_model=schemas.Transaction)
def create_transaction(
    transaction: schemas.TransactionCreate,
    workspace_id: int = Query(..., description="ID рабочего пространства"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user)
):
    """
    Создает новую транзакцию.
    """
    # Валидация, что все связанные ID принадлежат этому рабочему пространству
    crud.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    crud.validate_workspace_ownership_for_ids(
        db,
        workspace_id=workspace_id,
        account_ids=[transaction.account_id, transaction.related_account_id] if transaction.related_account_id else [transaction.account_id],
        dds_article_ids=[transaction.dds_article_id]
    )
    return crud.create_transaction(db=db, transaction=transaction, created_by_user_id=current_user.id, workspace_id=workspace_id)


@router.get("", response_model=schemas.TransactionPage)
def read_transactions(
    workspace_id: int = Query(..., description="ID рабочего пространства"),
    start_date: Optional[date] = Query(None, description="Начальная дата (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Конечная дата (YYYY-MM-DD)"),
    account_id: Optional[int] = Query(None, description="Фильтр по ID счета"),
    article_id: Optional[int] = Query(None, description="Фильтр по ID статьи ДДС"),
    transaction_type: Optional[schemas.TransactionType] = Query(None, description="Фильтр по типу транзакции (income, expense, transfer)"),
    page: int = Query(1, ge=1, description="Номер страницы"),
    size: int = Query(20, ge=1, le=100, description="Количество элементов на странице"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user)
):
    """
    Получает список транзакций с фильтрацией и пагинацией.
    """
    crud.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    
    transactions_query = crud.get_transactions_query(
        db,
        workspace_id=workspace_id,
        start_date=start_date,
        end_date=end_date,
        account_id=account_id,
        article_id=article_id,
        transaction_type=transaction_type
    )
    
    total_items = transactions_query.count()
    transactions = transactions_query.offset((page - 1) * size).limit(size).all()
    
    return schemas.TransactionPage(
        items=transactions,
        page=page,
        size=size,
        total=total_items
    )


@router.put("/{transaction_id}", response_model=schemas.Transaction)
def update_transaction(
    transaction_id: int,
    transaction: schemas.TransactionUpdate,
    workspace_id: int = Query(..., description="ID рабочего пространства"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user)
):
    """
    Обновляет существующую транзакцию.
    """
    crud.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    db_transaction = crud.get_transaction(db, transaction_id=transaction_id)
    
    if not db_transaction or db_transaction.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Транзакция не найдена")
        
    return crud.update_transaction(db=db, transaction_id=transaction_id, transaction_update=transaction, workspace_id=workspace_id)


@router.delete("/{transaction_id}", response_model=schemas.Transaction)
def delete_transaction(
    transaction_id: int,
    workspace_id: int = Query(..., description="ID рабочего пространства"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user)
):
    """
    Удаляет транзакцию.
    """
    crud.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    db_transaction = crud.get_transaction(db, transaction_id=transaction_id)

    if not db_transaction or db_transaction.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Транзакция не найдена")
        
    return crud.delete_transaction(db=db, transaction_id=transaction_id, workspace_id=workspace_id)