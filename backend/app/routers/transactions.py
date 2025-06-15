# backend/app/routers/transactions.py

from fastapi import APIRouter, Depends, HTTPException, Query, status # Добавил Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

# Явные импорты из других CRUD модулей
from ..crud.crud_transaction import get_transaction, create_transaction, get_transactions_with_filters, update_transaction, delete_transaction
from ..crud.crud_workspace import validate_workspace_owner, validate_workspace_ownership_for_ids # Импорт из crud_workspace
from ..dependencies import get_db, get_current_active_user # get_current_active_user вместо get_current_user для большей строгости

from .. import schemas, models # models и schemas остаются

router = APIRouter(
    prefix="/transactions", # Префикс роутера
    tags=["transactions"],
    dependencies=[Depends(get_current_active_user)] # Требуем активного пользователя
)

@router.post("/", response_model=schemas.Transaction, status_code=201)
async def create_transaction(
    transaction: schemas.TransactionCreate,
    workspace_id: int = Query(..., description="ID рабочего пространства"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id) # Вызываем напрямую
    validate_workspace_ownership_for_ids( # Вызываем напрямую
        db,
        workspace_id=workspace_id,
        user_id=current_user.id, # Передаем user_id
        account_ids=[transaction.account_id, transaction.related_account_id] if transaction.related_account_id else [transaction.account_id],
        dds_article_ids=[transaction.dds_article_id]
    )
    return create_transaction(db=db, transaction=transaction, created_by_user_id=current_user.id, workspace_id=workspace_id) # Вызываем напрямую


@router.get("/", response_model=schemas.TransactionPage)
async def read_transactions(
    workspace_id: int = Query(..., description="ID рабочего пространства"), # Сделал обязательным через Query
    skip: int = Query(0, ge=0), # ge=0 для неотрицательных значений
    limit: int = Query(20, ge=1, le=100), # ge=1, le=100 для лимита
    start_date: Optional[date] = Query(None, description="Начальная дата (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Конечная дата (YYYY-MM-DD)"),
    account_id: Optional[int] = Query(None, description="Фильтр по ID счета"),
    article_id: Optional[int] = Query(None, description="Фильтр по ID статьи ДДС"),
    transaction_type: Optional[schemas.TransactionType] = Query(None, description="Фильтр по типу транзакции (income, expense, transfer)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id) # Вызываем напрямую

    transactions, total_count = get_transactions_with_filters( # Вызываем напрямую
        db=db,
        owner_id=current_user.id,
        workspace_id=workspace_id,
        skip=skip,
        limit=limit,
        start_date=start_date,
        end_date=end_date,
        account_id=account_id,
        # article_id, # transaction_type не передаем сюда
        min_amount=None, # Отсутствовали в роуте, но есть в get_transactions_with_filters
        max_amount=None, # Отсутствовали в роуте, но есть в get_transactions_with_filters
        dds_article_ids=None # Отсутствовали в роуте, но есть в get_transactions_with_filters
    )
    return schemas.TransactionPage(
        items=transactions,
        page=skip // limit + 1,
        size=limit,
        total=total_count
    )


@router.put("/{transaction_id}", response_model=schemas.Transaction)
def update_transaction(
    transaction_id: int,
    transaction: schemas.TransactionUpdate,
    workspace_id: int = Query(..., description="ID рабочего пространства"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    db_transaction = get_transaction(db, transaction_id=transaction_id) # Вызываем напрямую
    
    if not db_transaction or db_transaction.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Транзакция не найдена")
        
    return update_transaction(db=db, transaction_id=transaction_id, transaction_update=transaction, workspace_id=workspace_id) # Вызываем напрямую


@router.delete("/{transaction_id}", status_code=204) # 204 No Content for successful deletion
def delete_transaction(
    transaction_id: int,
    workspace_id: int = Query(..., description="ID рабочего пространства"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    db_transaction = get_transaction(db, transaction_id=transaction_id) # Вызываем напрямую

    if not db_transaction or db_transaction.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Транзакция не найдена")
        
    delete_transaction(db=db, transaction_id=transaction_id, workspace_id=workspace_id) # Вызываем напрямую
    return # Для 204 No Content не возвращаем ничего