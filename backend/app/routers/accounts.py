# backend/app/routers/accounts.py
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

# ИЗМЕНЕНИЕ: импортируем конкретные схемы
from .. import crud, auth_utils, models
from ..schemas import Account, AccountCreate, AccountUpdate
from ..database import get_db

router = APIRouter(
    prefix="/api/accounts",
    tags=["Accounts"],
    dependencies=[Depends(auth_utils.get_current_active_user)]
)

# --- Весь остальной код в этом файле остается без изменений, только импорты выше ---

@router.post("", response_model=Account)
def create_account(
    account: AccountCreate,
    workspace_id: int = Query(..., description="ID рабочего пространства, к которому относится счет"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user)
):
    crud.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    return crud.create_account(db=db, account=account, workspace_id=workspace_id, user_id=current_user.id)

@router.get("", response_model=List[Account])
def read_accounts(
    workspace_id: int = Query(..., description="ID рабочего пространства для фильтрации счетов"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user)
):
    crud.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    return crud.get_accounts(db=db, workspace_id=workspace_id)

@router.put("/{account_id}", response_model=Account)
def update_account(
    account_id: int,
    account: AccountUpdate,
    workspace_id: int = Query(..., description="ID рабочего пространства, которому принадлежит счет"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user)
):
    crud.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    db_account = crud.get_account(db, account_id=account_id)
    if not db_account or db_account.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Счет не найден в данном рабочем пространстве")
    return crud.update_account(db=db, account_id=account_id, account_update=account)

@router.delete("/{account_id}", response_model=Account)
def delete_account(
    account_id: int,
    workspace_id: int = Query(..., description="ID рабочего пространства, которому принадлежит счет"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user)
):
    crud.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    db_account = crud.get_account(db, account_id=account_id)
    if not db_account or db_account.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Счет не найден в данном рабочем пространстве")
    return crud.delete_account(db=db, account_id=account_id)