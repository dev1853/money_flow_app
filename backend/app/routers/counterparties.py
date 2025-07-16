# backend/app/routers/counterparties.py

from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query # Добавлен Query
from sqlalchemy.orm import Session

from .. import crud, schemas, models
from ..dependencies import get_db, get_current_active_user, get_workspace_from_query
from ..models.counterparty import CounterpartyType # Убедитесь, что CounterpartyType импортирован

router = APIRouter(
    tags=["counterparties"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.Counterparty, status_code=status.HTTP_201_CREATED)
def create_counterparty(
    counterparty_in: schemas.CounterpartyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    workspace: models.Workspace = Depends(get_workspace_from_query),
) -> Any:
    """
    Создать нового контрагента.
    """
    counterparty = crud.counterparty.create_with_owner(
        db=db,
        obj_in=counterparty_in,
        owner_id=current_user.id,
        workspace_id=workspace.id,
    )
    return counterparty

@router.get("/", response_model=schemas.CounterpartyPage) # ИСПРАВЛЕНО: Схема ответа изменена на CounterpartyPage
def read_counterparties(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    workspace: models.Workspace = Depends(get_workspace_from_query),
    search: Optional[str] = Query(None), # Фильтр по имени/контактам
    type: Optional[CounterpartyType] = Query(None) # Фильтр по типу
) -> Any:
    """
    Получить пагинированный список контрагентов.
    """
    total_count = crud.counterparty.get_count_by_workspace(db, workspace_id=workspace.id, search=search, type=type) # ИСПРАВЛЕНО: Используем метод подсчета
    counterparties = crud.counterparty.get_multi_by_workspace(db, skip=skip, limit=limit, workspace_id=workspace.id, search=search, type=type) # ИСПРАВЛЕНО: Передаем фильтры
    return {"items": counterparties, "total": total_count} # ИСПРАВЛЕНО: Возвращаем пагинированный объект

@router.put("/{counterparty_id}", response_model=schemas.Counterparty)
def update_counterparty(
    counterparty_id: int,
    counterparty_in: schemas.CounterpartyUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    workspace: models.Workspace = Depends(get_workspace_from_query),
) -> Any:
    """
    Обновить существующего контрагента.
    """
    counterparty = crud.counterparty.get(db, id=counterparty_id)
    if not counterparty or counterparty.workspace_id != workspace.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Контрагент не найден или не принадлежит вашему рабочему пространству.",
        )
    counterparty = crud.counterparty.update(db, db_obj=counterparty, obj_in=counterparty_in)
    db.commit()
    db.refresh(counterparty)
    return counterparty

@router.delete("/{counterparty_id}", response_model=schemas.Counterparty)
def delete_counterparty(
    counterparty_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    workspace: models.Workspace = Depends(get_workspace_from_query),
) -> Any:
    """
    Удалить контрагента.
    """
    counterparty = crud.counterparty.get(db, id=counterparty_id)
    if not counterparty or counterparty.workspace_id != workspace.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Контрагент не найден или не принадлежит вашему рабочему пространству.",
        )
    counterparty = crud.counterparty.remove(db, id=counterparty_id)
    db.commit()
    return counterparty

