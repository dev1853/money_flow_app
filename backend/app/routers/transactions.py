# backend/app/routers/transactions.py

from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request 
from sqlalchemy.orm import Session
from pydantic import ValidationError 

from app import crud, schemas, models
from app.dependencies import get_db, get_current_active_user, get_transaction_for_user
from app.schemas import TransactionType
from datetime import date 
from fastapi.encoders import jsonable_encoder

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
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    workspace_id: int = Query(..., description="ID рабочего пространства"),
    page: int = Query(1, ge=1, description="Номер страницы"),
    size: int = Query(20, ge=1, le=100, description="Количество элементов на странице"),
    start_date: Optional[date] = Query(None, description="Дата начала периода (ГГГГ-ММ-ДД)"),
    end_date: Optional[date] = Query(None, description="Дата окончания периода (ГГГГ-ММ-ДД)"),
    transaction_type: Optional[schemas.TransactionType] = Query(None, description="Тип транзакции (income/expense)"),
    account_id: Optional[int] = Query(None, description="ID счета"),
    dds_article_id: Optional[int] = Query(None, description="ID статьи ДДС")
) -> Any:
    """
    Получает пагинированный список транзакций с фильтрами.
    """
    print(f"DEBUG (Transaction Router - GET): Request received for workspace_id={workspace_id}, dds_article_id={dds_article_id}") 
    print(f"DEBUG (Transaction Router - GET): Raw query parameters from Request: {request.query_params}") 
    print(f"DEBUG (Transaction Router - GET): Type of dds_article_id received: {type(dds_article_id)}, Value: {dds_article_id}") 

    transactions_data_from_crud = crud.transaction.get_multi_paginated_by_workspace_and_filters(
        db=db,
        workspace_id=workspace_id,
        page=page,
        size=size,
        start_date=start_date,
        end_date=end_date,
        transaction_type=transaction_type,
        account_id=account_id,
        dds_article_id=dds_article_id
    )
    
    print(f"DEBUG (Transaction Router - GET): Data returned from CRUD: {transactions_data_from_crud}") 
    print(f"DEBUG (Transaction Router - GET): Type of data returned from CRUD: {type(transactions_data_from_crud)}") 

    # <--- НОВЫЙ ЛОГ: Показываем, как FastAPI будет сериализовать данные
    try:
        # Пытаемся вручную сериализовать данные в Pydantic модель для отладки
        validated_response = schemas.TransactionPage.parse_obj(transactions_data_from_crud) # Для Pydantic V1
        # Для Pydantic V2 используйте schemas.TransactionPage.model_validate(transactions_data_from_crud)
        
        serialized_data = jsonable_encoder(validated_response)
        print(f"DEBUG (Transaction Router - GET): Successfully serialized data to Pydantic model. Type: {type(validated_response)}, JSON: {serialized_data}")
    except ValidationError as e:
        print(f"ERROR (Transaction Router - GET): Pydantic ValidationError during manual serialization check: {e.errors()}")
    except Exception as e:
        print(f"ERROR (Transaction Router - GET): Unexpected error during manual serialization check: {e}")
    # >>>>

    return transactions_data_from_crud

@router.put("/{transaction_id}", response_model=schemas.Transaction)
def update_transaction(
    *,
    db: Session = Depends(get_db),
    transaction_id: int,
    transaction_in: schemas.TransactionUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """
    Обновить существующую транзакцию.
    """
    print(f"DEBUG (Transaction Router - PUT): Received request to update transaction ID: {transaction_id}") # <--- ЛОГ
    print(f"DEBUG (Transaction Router - PUT): transaction_in data: {transaction_in.dict()}") # <--- ЛОГ: Проверяем входящие данные
    print(f"DEBUG (Transaction Router - PUT): Type of transaction_in.date: {type(transaction_in.date)}, Value: {transaction_in.date}") # <--- ЛОГ: Детали даты

    transaction = crud.transaction.get(db, id=transaction_id)
    if not transaction:
        print(f"DEBUG (Transaction Router - PUT): Transaction ID {transaction_id} not found.") # <--- ЛОГ
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Транзакция не найдена.")
    if transaction.owner_id != current_user.id:
        print(f"DEBUG (Transaction Router - PUT): User {current_user.id} tried to update transaction {transaction_id} not owned by them.") # <--- ЛОГ
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="У вас нет прав для изменения этой транзакции.")

    # Проверка принадлежности статьи ДДС, если она указана
    if transaction_in.dds_article_id is not None and transaction_in.dds_article_id != transaction.dds_article_id:
        dds_article = crud.dds_article.get(db, id=transaction_in.dds_article_id)
        if not dds_article or dds_article.owner_id != current_user.id:
            print(f"DEBUG (Transaction Router - PUT): Invalid dds_article_id {transaction_in.dds_article_id}.") # <--- ЛОГ
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Указанная статья ДДС не существует или не принадлежит текущему пользователю.",
            )
    
    # НОВОЕ: Автоматическое определение dds_article_id, если оно не указано и не было ранее
    # Это важно, т.к. при PUT запросе dds_article_id может быть None,
    # и мы должны его заполнить, только если он явно не был изменен или задан
    if transaction_in.dds_article_id is None and transaction.dds_article_id is None: # Если и в запросе None, и в БД None
        if transaction_in.description and transaction_in.transaction_type:
            print("DEBUG (Auto-categorization - Router PUT): Attempting to auto-categorize transaction during update.") # <--- ЛОГ
            matched_dds_article_id = crud.mapping_rule.find_matching_dds_article_id(
                db=db,
                workspace_id=current_user.active_workspace_id,
                description=transaction_in.description,
                transaction_type=transaction_in.transaction_type
            )
            if matched_dds_article_id:
                transaction_in.dds_article_id = matched_dds_article_id
                print(f"DEBUG (Auto-categorization - Router PUT): DDS Article ID {matched_dds_article_id} assigned automatically.") # <--- ЛОГ
            else:
                print(f"DEBUG (Auto-categorization - Router PUT): No matching rule found for description: '{transaction_in.description}'. DDS Article ID remains None.") # <--- ЛОГ
        else:
            print("DEBUG (Auto-categorization - Router PUT): Description or Transaction Type missing for auto-categorization during update.") # <--- ЛОГ


    try:
        updated_transaction = crud.transaction.update(db=db, db_obj=transaction, obj_in=transaction_in)
        # Пересчет баланса счета после обновления транзакции
        crud.account.recalculate_balance(db=db, account_id=updated_transaction.account_id)
        print(f"DEBUG (Transaction Router - PUT): Transaction ID {transaction_id} updated successfully.") # <--- ЛОГ
        return updated_transaction
    except ValidationError as e: # <--- Отлавливаем ошибки Pydantic явно
        print(f"ERROR (Transaction Router - PUT): Pydantic Validation Error during update: {e.errors()}") # <--- ЛОГ ОШИБКИ ВАЛИДАЦИИ
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.errors()
        )
    except Exception as e:
        print(f"ERROR (Transaction Router - PUT): Unexpected error during transaction update: {e}") # <--- ЛОГ
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Внутренняя ошибка сервера при обновлении транзакции."
        )

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