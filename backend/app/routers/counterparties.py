# /backend/app/routers/counterparties.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import crud, models, schemas
from ..dependencies import get_db, get_current_active_user, get_current_active_workspace

router = APIRouter(
    prefix="/counterparties",
    tags=["counterparties"],
    dependencies=[Depends(get_current_active_user)],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.Counterparty, status_code=status.HTTP_201_CREATED)
def create_counterparty(
    *,
    db: Session = Depends(get_db),
    counterparty_in: schemas.CounterpartyCreate,
    current_workspace: models.Workspace = Depends(get_current_active_workspace),
):
    """
    Создать нового контрагента.
    """
    # Здесь можно добавить проверку на уникальность по ИНН, если нужно
    return crud.counterparty.create(db=db, obj_in=counterparty_in, workspace_id=current_workspace.id)

@router.get("/", response_model=List[schemas.Counterparty])
def read_counterparties(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_workspace: models.Workspace = Depends(get_current_active_workspace),
):
    """
    Получить список контрагентов для текущего рабочего пространства.
    """
    return crud.counterparty.get_multi_by_workspace(
        db=db, workspace_id=current_workspace.id, skip=skip, limit=limit
    )

@router.put("/{counterparty_id}", response_model=schemas.Counterparty)
def update_counterparty(
    *,
    db: Session = Depends(get_db),
    counterparty_id: int,
    counterparty_in: schemas.CounterpartyUpdate,
    current_workspace: models.Workspace = Depends(get_current_active_workspace),
):
    """
    Обновить контрагента.
    """
    cp = crud.counterparty.get(db=db, id=counterparty_id)
    if not cp or cp.workspace_id != current_workspace.id:
        raise HTTPException(status_code=404, detail="Контрагент не найден")
    
    updated_cp = crud.counterparty.update(db=db, db_obj=cp, obj_in=counterparty_in)
    db.commit()
    return updated_cp

@router.delete("/{counterparty_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_counterparty(
    *,
    db: Session = Depends(get_db),
    counterparty_id: int,
    current_workspace: models.Workspace = Depends(get_current_active_workspace),
):
    """
    Удалить контрагента.
    """
    cp = crud.counterparty.get(db=db, id=counterparty_id)
    if not cp or cp.workspace_id != current_workspace.id:
        raise HTTPException(status_code=404, detail="Контрагент не найден")
    
    # Здесь можно добавить проверку, не привязан ли контрагент к транзакциям, перед удалением
    crud.counterparty.remove(db=db, id=counterparty_id)
    db.commit()
    return