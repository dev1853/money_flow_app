# backend/app/routers/accounts.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List 

# Импортируем все необходимые зависимости напрямую
from .. import crud, models, schemas
from ..dependencies import get_db, get_current_active_user

router = APIRouter(
    tags=["accounts"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=schemas.Account)
def create_account(
    account: schemas.AccountCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Создает новый счет в указанном рабочем пространстве.
    """
    if not crud.workspace.is_owner(db=db, workspace_id=account.workspace_id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return crud.account.create(db=db, obj_in=account)


@router.get("/", response_model=List[schemas.Account])
def read_accounts_by_workspace(
    workspace_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Получает список счетов для конкретного рабочего пространства.
    """
    if not crud.workspace.is_owner(db=db, workspace_id=workspace_id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    accounts = crud.account.get_multi_by_workspace(db, workspace_id=workspace_id, skip=skip, limit=limit)
    return accounts


@router.get("/{account_id}", response_model=schemas.Account)
def read_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Получение счета по ID с проверкой прав доступа.
    """
    db_account = crud.account.get(db, id=account_id)
    if not db_account:
        raise HTTPException(status_code=404, detail="Account not found")

    if not crud.workspace.is_owner(db=db, workspace_id=db_account.workspace_id, user_id=current_user.id):
        raise HTTPException(status_code=404, detail="Account not found")

    return db_account


@router.put("/{account_id}", response_model=schemas.Account)
def update_account(
    account_id: int,
    account_in: schemas.AccountUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Обновление счета с проверкой прав доступа.
    """
    db_account = crud.account.get(db, id=account_id)
    if not db_account:
        raise HTTPException(status_code=404, detail="Account not found")

    if not crud.workspace.is_owner(db=db, workspace_id=db_account.workspace_id, user_id=current_user.id):
        raise HTTPException(status_code=404, detail="Account not found")

    account = crud.account.update(db, db_obj=db_account, obj_in=account_in)
    return account


@router.delete("/{account_id}", response_model=schemas.Account)
def delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Удаление счета с проверкой прав доступа.
    """
    db_account = crud.account.get(db, id=account_id)
    if not db_account:
        raise HTTPException(status_code=404, detail="Account not found")

    if not crud.workspace.is_owner(db=db, workspace_id=db_account.workspace_id, user_id=current_user.id):
        raise HTTPException(status_code=404, detail="Account not found")

    account = crud.account.remove(db, id=account_id)
    return account