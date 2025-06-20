# backend/app/routers/transactions.py
from typing import List, Any, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.dependencies import get_db, get_current_active_user, get_transaction_for_user, get_account_for_user

router = APIRouter(tags=["transactions"], dependencies=[Depends(get_current_active_user)])

@router.post("/", response_model=schemas.Transaction)
def create_transaction(
    *,
    db: Session = Depends(get_db),
    transaction_in: schemas.TransactionCreate,
    current_user: models.User = Depends(get_current_active_user),
) -> models.Transaction:
    # Используем зависимость для проверки счета
    account = get_account_for_user(db=db, account_id=transaction_in.account_id, current_user=current_user)
    
    # Проверяем статью ДДС, если она есть
    if transaction_in.dds_article_id:
        article = crud.dds_article.get(db, id=transaction_in.dds_article_id)
        if not article or article.workspace_id != account.workspace_id:
            raise HTTPException(status_code=400, detail="DDS Article is invalid or does not belong to the workspace")
            
    transaction = crud.transaction.create_with_owner_and_workspace(
        db=db, obj_in=transaction_in, owner_id=current_user.id, workspace_id=account.workspace_id
    )
    crud.account.recalculate_balance(db, account_id=transaction.account_id)
    return transaction

@router.get("/", response_model=schemas.TransactionPage)
def read_transactions(
    workspace_id: int,
    db: Session = Depends(get_db),
    # ... другие фильтры ...
    current_user: models.User = Depends(get_current_active_user),
):
    # ... ваш код получения списка транзакций, проверка прав здесь важна и остается ...
    return crud.transaction.get_multi_by_workspace_and_filters(...)

@router.get("/{transaction_id}", response_model=schemas.Transaction)
def read_transaction(*, transaction: models.Transaction = Depends(get_transaction_for_user)):
    return transaction

@router.put("/{transaction_id}", response_model=schemas.Transaction)
def update_transaction(
    *,
    db: Session = Depends(get_db),
    transaction_in: schemas.TransactionUpdate,
    transaction: models.Transaction = Depends(get_transaction_for_user),
):
    updated_transaction = crud.transaction.update(db=db, db_obj=transaction, obj_in=transaction_in)
    crud.account.recalculate_balance(db, account_id=updated_transaction.account_id)
    return updated_transaction

@router.delete("/{transaction_id}", response_model=schemas.Transaction)
def delete_transaction(
    *,
    db: Session = Depends(get_db),
    transaction: models.Transaction = Depends(get_transaction_for_user),
):
    account_id_to_recalculate = transaction.account_id
    deleted_transaction = crud.transaction.remove(db=db, id=transaction.id)
    crud.account.recalculate_balance(db, account_id=account_id_to_recalculate)
    return deleted_transaction