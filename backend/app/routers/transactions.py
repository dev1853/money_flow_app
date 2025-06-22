# backend/app/routers/transactions.py
from typing import List, Any, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.dependencies import get_db, get_current_active_user, get_transaction_for_user, get_account_for_user

router = APIRouter(tags=["transactions"], dependencies=[Depends(get_current_active_user)])

@router.post("/", response_model=schemas.Transaction, status_code=status.HTTP_201_CREATED)
def create_transaction(
    *,
    db: Session = Depends(get_db),
    transaction_in: schemas.TransactionCreate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """
    Создать новую транзакцию.
    """
    # Проверка принадлежности счета
    account = crud.account.get(db, id=transaction_in.account_id)
    if not account or account.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Указанный счет не существует или не принадлежит текущему пользователю.",
        )
    
    # Проверка принадлежности статьи ДДС, если она указана
    if transaction_in.dds_article_id:
        dds_article = crud.dds_article.get(db, id=transaction_in.dds_article_id)
        if not dds_article or dds_article.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Указанная статья ДДС не существует или не принадлежит текущему пользователю.",
            )

    # НОВОЕ: Автоматическое определение dds_article_id, если оно не указано
    if transaction_in.dds_article_id is None:
        if transaction_in.description and transaction_in.transaction_type:
            print("DEBUG (Auto-categorization - Router): Attempting to auto-categorize transaction.") # <--- ЛОГ
            # Используем функцию поиска правила
            matched_dds_article_id = crud.mapping_rule.find_matching_dds_article_id(
                db=db,
                workspace_id=current_user.active_workspace_id,
                description=transaction_in.description,
                transaction_type=transaction_in.transaction_type
            )
            if matched_dds_article_id:
                # Если правило найдено, присваиваем ID статьи ДДС
                transaction_in.dds_article_id = matched_dds_article_id
                print(f"DEBUG (Auto-categorization - Router): DDS Article ID {matched_dds_article_id} assigned automatically for description: '{transaction_in.description}'.") # <--- ЛОГ
            else:
                print(f"DEBUG (Auto-categorization - Router): No matching rule found for description: '{transaction_in.description}'. DDS Article ID remains None.") # <--- ЛОГ
        else:
            print("DEBUG (Auto-categorization - Router): Description or Transaction Type missing, skipping auto-categorization.") # <--- ЛОГ


    # Создание транзакции
    transaction = crud.transaction.create_with_owner_and_workspace(
        db=db, obj_in=transaction_in, owner_id=current_user.id, workspace_id=current_user.active_workspace_id
    )
    
    # Пересчет баланса счета после создания транзакции
    crud.account.recalculate_balance(db=db, account_id=transaction.account_id)
    
    return transaction

@router.get("/", response_model=schemas.TransactionPage)
def read_transactions(
    *,
    db: Session = Depends(get_db),
    workspace_id: int,
    current_user: models.User = Depends(get_current_active_user),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    # Добавим остальные фильтры
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    transaction_type: Optional[schemas.TransactionType] = None,
    account_id: Optional[int] = None
):
    """
    Получает список транзакций с пагинацией и фильтрами.
    """
    if not crud.workspace.is_owner_or_member(db, workspace_id=workspace_id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Используем новую CRUD-функцию, которая поддерживает пагинацию
    transactions_data = crud.transaction.get_multi_paginated_by_workspace_and_filters(
        db,
        workspace_id=workspace_id,
        page=page,
        size=size,
        start_date=start_date,
        end_date=end_date,
        transaction_type=transaction_type,
        account_id=account_id
    )
    return transactions_data

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