from typing import List, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.dependencies import get_db, get_current_active_user, get_workspace_for_user, get_account_for_user

router = APIRouter(tags=["accounts"], dependencies=[Depends(get_current_active_user)])

@router.post("/", response_model=schemas.Account)
def create_account(account_in: schemas.AccountCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    # Проверяем права на воркспейс, к которому привязываем счет
    crud.workspace.is_owner_or_member(db=db, workspace_id=account_in.workspace_id, user_id=current_user.id)
    return crud.account.create_with_owner(db=db, obj_in=account_in, owner_id=current_user.id)

@router.get("/", response_model=List[schemas.Account])
def read_accounts(workspace_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    # Проверяем права на воркспейс, чьи счета смотрим
    crud.workspace.is_owner_or_member(db=db, workspace_id=workspace_id, user_id=current_user.id)
    return crud.account.get_multi_by_workspace(db, workspace_id=workspace_id)

@router.get("/{account_id}", response_model=schemas.Account)
def read_account(*, account: models.Account = Depends(get_account_for_user)):
    return account

@router.put("/{account_id}", response_model=schemas.Account)
def update_account(*, db: Session = Depends(get_db), account_in: schemas.AccountUpdate, account: models.Account = Depends(get_account_for_user)):
    return crud.account.update(db=db, db_obj=account, obj_in=account_in)

@router.delete("/{account_id}", response_model=schemas.Account)
def delete_account(*, db: Session = Depends(get_db), account: models.Account = Depends(get_account_for_user)):
    return crud.account.remove(db=db, id=account.id)