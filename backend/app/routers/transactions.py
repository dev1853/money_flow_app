# backend/app/routers/transactions.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..dependencies import get_db, get_current_active_user

router = APIRouter(
    prefix="/transactions",
    tags=["transactions"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.Transaction)
def create_transaction(
    transaction: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    db_account = crud.account.get(db, id=transaction.account_id)
    if not db_account:
        raise HTTPException(status_code=404, detail="Account not found")
    if not crud.workspace.is_owner(db, workspace_id=db_account.workspace_id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    created_transaction = crud.transaction.create(db=db, obj_in=transaction)
    # Используем надежный пересчет баланса вместо простого добавления
    crud.account.recalculate_balance(db, account_id=transaction.account_id)
    return created_transaction

@router.get("/", response_model=List[schemas.Transaction])
def read_transactions(
    account_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    db_account = crud.account.get(db, id=account_id)
    if not db_account:
        raise HTTPException(status_code=404, detail="Account not found")
    if not crud.workspace.is_owner(db=db, workspace_id=db_account.workspace_id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    transactions = crud.transaction.get_multi_by_account(db, account_id=account_id, skip=skip, limit=limit)
    return transactions

@router.put("/{transaction_id}", response_model=schemas.Transaction)
def update_transaction(
    transaction_id: int,
    transaction_in: schemas.TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    db_transaction = crud.transaction.get(db, id=transaction_id)
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # --- ИСПРАВЛЕНИЕ: ПРОВЕРКА ПРАВ ДОСТУПА ---
    db_account = crud.account.get(db, id=db_transaction.account_id)
    if not crud.workspace.is_owner(db=db, workspace_id=db_account.workspace_id, user_id=current_user.id):
        raise HTTPException(status_code=404, detail="Transaction not found")

    updated_transaction = crud.transaction.update(db, db_obj=db_transaction, obj_in=transaction_in)
    
    # --- ИСПРАВЛЕНИЕ: ПЕРЕСЧЕТ БАЛАНСА ---
    crud.account.recalculate_balance(db, account_id=db_transaction.account_id)
    
    return updated_transaction

@router.delete("/{transaction_id}", response_model=schemas.Transaction)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    db_transaction = crud.transaction.get(db, id=transaction_id)
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # --- ИСПРАВЛЕНИЕ: ПРОВЕРКА ПРАВ ДОСТУПА ---
    db_account = crud.account.get(db, id=db_transaction.account_id)
    if not crud.workspace.is_owner(db=db, workspace_id=db_account.workspace_id, user_id=current_user.id):
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    account_id_to_recalculate = db_transaction.account_id
    deleted_transaction = crud.transaction.remove(db, id=transaction_id)
    
    # --- ИСПРАВЛЕНИЕ: ПЕРЕСЧЕТ БАЛАНСА ---
    crud.account.recalculate_balance(db, account_id=account_id_to_recalculate)
    
    return deleted_transaction