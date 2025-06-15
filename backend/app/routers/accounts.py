# backend/app/routers/accounts.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import crud, schemas, models
from ..dependencies import get_db, get_current_user, get_current_active_user # Импортируем из dependencies

router = APIRouter(
    prefix="/accounts", # Префикс должен быть "/accounts", а не "/api/accounts"
    tags=["accounts"],
    dependencies=[Depends(get_current_active_user)] # Требуем активного пользователя
)

@router.get("/", response_model=List[schemas.Account])
async def read_accounts(
    workspace_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    accounts_query = db.query(models.Account).filter(models.Account.owner_id == current_user.id)

    if workspace_id is not None:
        accounts_query = accounts_query.filter(models.Account.workspace_id == workspace_id)
    
    if is_active is not None:
        accounts_query = accounts_query.filter(models.Account.is_active == is_active)

    accounts = accounts_query.offset(skip).limit(limit).all()
    return accounts

@router.post("/", response_model=schemas.Account, status_code=201)
async def create_account(
    account: schemas.AccountCreate,
    workspace_id: int = Query(..., description="ID рабочего пространства, которому принадлежит счет"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Убедись, что crud.validate_workspace_owner и crud.create_account существуют
    crud.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    db_account = crud.create_account(db=db, account=account, owner_id=current_user.id, workspace_id=workspace_id)
    return db_account

@router.put("/{account_id}", response_model=schemas.Account)
def update_account(
    account_id: int,
    account: schemas.AccountUpdate,
    workspace_id: int = Query(..., description="ID рабочего пространства, которому принадлежит счет"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    crud.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    db_account = crud.get_account(db, account_id=account_id)
    if not db_account or db_account.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Счет не найден в данном рабочем пространстве")
    return crud.update_account(db=db, account_id=account_id, account_update=account)

@router.delete("/{account_id}", response_model=schemas.Account)
def delete_account(
    account_id: int,
    workspace_id: int = Query(..., description="ID рабочего пространства, которому принадлежит счет"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    crud.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    db_account = crud.get_account(db, account_id=account_id)
    if not db_account or db_account.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Счет не найден в данном рабочем пространстве")
    
    return crud.delete_account(db=db, account_id=account_id)