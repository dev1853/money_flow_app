# backend/app/routers/transactions.py

from typing import List, Optional # Добавлен Optional для параметров запроса
from fastapi import APIRouter, Depends, HTTPException, status, Query # Добавлен Query
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    
    # ИСПРАВЛЕНО: Если счет найден, но пользователь не владелец - 403
    if not crud.workspace.is_owner(db, workspace_id=db_account.workspace_id, user_id=current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to add transaction to this account/workspace")
    
    created_transaction = crud.transaction.create(db=db, obj_in=transaction, owner_id=current_user.id, workspace_id=db_account.workspace_id) # Убедитесь, что crud.transaction.create принимает owner_id и workspace_id
    
    # Используем надежный пересчет баланса
    # Эта функция должна быть в crud.account и быть публичной
    crud.account.recalculate_balance(db, account_id=transaction.account_id)
    return created_transaction


@router.get("/", response_model=List[schemas.Transaction])
def read_transactions(
    # ИСПРАВЛЕНО: account_id стал Optional (если вы хотите фильтрацию)
    # Если account_id всегда должен быть, удалите Optional и default=None
    account_id: Optional[int] = Query(None, description="ID счета для фильтрации"), 
    skip: int = Query(0, ge=0), # Добавлены ограничения для skip и limit
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    # Добавьте параметры фильтрации, если они нужны, например:
    # start_date: Optional[date] = Query(None),
    # end_date: Optional[date] = Query(None),
    # transaction_type: Optional[schemas.TransactionType] = Query(None),
    # dds_article_id: Optional[int] = Query(None),
):
    # ИСПРАВЛЕНО: Валидация рабочего пространства и account_id
    if not current_user.active_workspace_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Рабочее пространство не выбрано.")

    # Проверяем, что workspace_id соответствует активному рабочему пространству пользователя
    # Если active_workspace_id есть, но не совпадает с workspace_id из запроса
    # (если workspace_id был бы параметром запроса)
    # Здесь мы используем active_workspace_id напрямую
    workspace_id = current_user.active_workspace_id

    # Если account_id передан, нужно проверить, что он принадлежит текущему пользователю и рабочему пространству
    if account_id:
        db_account = crud.account.get(db, id=account_id)
        if not db_account or db_account.workspace_id != workspace_id or db_account.owner_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ к счету запрещен или счет не найден.")
    else:
        # Если account_id не передан, то нужно получить все счета пользователя в текущем workspace
        # и получить транзакции для всех этих счетов.
        # Для простоты, если account_id необязателен, но фильтрации нет, может быть слишком много данных.
        # Сейчас мы сделаем его обязательным, так как frontend его не передает
        # Если вы хотите, чтобы account_id был необязательным и возвращал ВСЕ транзакции в workspace,
        # тогда удалите эту проверку и измените crud.transaction.get_multi_by_account
        # на get_multi_by_workspace.
        # raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Параметр account_id обязателен.")
        pass # Оставим его необязательным для отладки

    transactions = crud.transaction.get_transactions(
        db,
        workspace_id=workspace_id,
        owner_id=current_user.id,
        account_id=account_id, # Передаем account_id
        skip=skip,
        limit=limit,
        # ... другие параметры фильтрации
    )
    
    # Для пагинации нужен total_count
    total_transactions = crud.transaction.get_transactions_count(
        db,
        workspace_id=workspace_id,
        owner_id=current_user.id,
        account_id=account_id,
        # ... другие параметры фильтрации
    )

    return {"items": transactions, "total_count": total_transactions} # Возвращаем объект для пагинации


@router.put("/{transaction_id}", response_model=schemas.Transaction)
def update_transaction(
    transaction_id: int,
    transaction_in: schemas.TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    db_transaction = crud.transaction.get(db, id=transaction_id)
    if not db_transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Транзакция не найдена")

    db_account = crud.account.get(db, id=db_transaction.account_id)
    # ИСПРАВЛЕНО: Если транзакция или счет не принадлежат пользователю/воркспейсу - 403
    if not db_account or db_account.workspace_id != db_transaction.workspace_id or db_account.owner_id != current_user.id:
         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Недостаточно прав для изменения этой транзакции.")

    updated_transaction = crud.transaction.update(db, db_obj=db_transaction, obj_in=transaction_in)
    
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Транзакция не найдена")

    db_account = crud.account.get(db, id=db_transaction.account_id)
    # ИСПРАВЛЕНО: Если транзакция или счет не принадлежат пользователю/воркспейсу - 403
    if not db_account or db_account.workspace_id != db_transaction.workspace_id or db_account.owner_id != current_user.id:
         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Недостаточно прав для удаления этой транзакции.")
    
    account_id_to_recalculate = db_transaction.account_id
    deleted_transaction = crud.transaction.remove(db, id=transaction_id)
    
    crud.account.recalculate_balance(db, account_id=account_id_to_recalculate)
    
    return deleted_transaction