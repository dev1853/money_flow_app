# backend/app/routers/contracts.py

from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query # Добавлен Query
from sqlalchemy.orm import Session


from .. import crud, schemas, models
from ..dependencies import get_db, get_current_active_user, get_workspace_from_query

router = APIRouter(
    tags=["contracts"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.Contract, status_code=status.HTTP_201_CREATED)
def create_contract(
    contract_in: schemas.ContractCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    workspace: models.Workspace = Depends(get_workspace_from_query),
) -> Any:
    """
    Создать новый договор.
    """
    # Проверяем, что counterparty_id принадлежит текущему рабочему пространству
    counterparty = crud.counterparty.get(db, id=contract_in.counterparty_id)
    if not counterparty or counterparty.workspace_id != workspace.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Указанный контрагент не найден или не принадлежит вашему рабочему пространству.",
        )

    contract = crud.contract.create_with_owner(
        db=db,
        obj_in=contract_in,
        workspace_id=workspace.id,
    )
    return contract

@router.get("/", response_model=schemas.ContractPage) # ИСПРАВЛЕНО: Схема ответа изменена на ContractPage
def read_contracts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    workspace: models.Workspace = Depends(get_workspace_from_query),
) -> Any:
    """
    Получить пагинированный список договоров.
    """
    total_count = crud.contract.get_count_by_workspace(db, workspace_id=workspace.id) # ИСПРАВЛЕНО: Используем метод подсчета
    contracts = crud.contract.get_multi_by_workspace(db, skip=skip, limit=limit, workspace_id=workspace.id) # ИСПРАВЛЕНО: Передаем workspace_id
    return {"items": contracts, "total": total_count} # ИСПРАВЛЕНО: Возвращаем пагинированный объект

@router.put("/{contract_id}", response_model=schemas.Contract)
def update_contract(
    contract_id: int,
    contract_in: schemas.ContractUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    workspace: models.Workspace = Depends(get_workspace_from_query),
) -> Any:
    """
    Обновить существующий договор.
    """
    contract = crud.contract.get(db, id=contract_id)
    if not contract or contract.workspace_id != workspace.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Договор не найден или не принадлежит вашему рабочему пространству.",
        )
    
    # Проверяем, что новый counterparty_id (если он предоставлен) принадлежит текущему рабочему пространству
    if contract_in.counterparty_id is not None:
        counterparty = crud.counterparty.get(db, id=contract_in.counterparty_id)
        if not counterparty or counterparty.workspace_id != workspace.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Указанный контрагент не найден или не принадлежит вашему рабочему пространству.",
            )

    contract = crud.contract.update(db, db_obj=contract, obj_in=contract_in)
    db.commit()
    db.refresh(contract)
    return contract

@router.delete("/{contract_id}", response_model=schemas.Contract)
def delete_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    workspace: models.Workspace = Depends(get_workspace_from_query),
) -> Any:
    """
    Удалить договор.
    """
    contract = crud.contract.get(db, id=contract_id)
    if not contract or contract.workspace_id != workspace.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Договор не найден или не принадлежит вашему рабочему пространству.",
        )
    contract = crud.contract.remove(db, id=contract_id)
    db.commit()
    return contract