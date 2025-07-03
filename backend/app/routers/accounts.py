# /backend/app/routers/accounts.py

from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import crud, models, schemas
# --- ИСПРАВЛЕННЫЙ ИМПОРТ ---
from ..dependencies import (
    get_db,
    get_current_active_user,
    get_workspace_from_path,  # <-- Используем новую зависимость для проверки прав на workspace
    get_account_for_user      # <-- Эта зависимость уже была правильной
)
# --- Импортируем сервисы, если они понадобятся ---
from ..services.account_service import account_service

router = APIRouter(
    tags=["accounts"],
    dependencies=[Depends(get_current_active_user)]
)

@router.post("/", response_model=schemas.Account, status_code=status.HTTP_201_CREATED)
def create_account(
    *,
    db: Session = Depends(get_db),
    account_in: schemas.AccountCreate,
    current_user: models.User = Depends(get_current_active_user)
) -> Any:
    """
    Создать новый счет в указанном рабочем пространстве.
    Права на рабочее пространство проверяются в сервисе.
    """
    try:
        # Делегируем создание и проверку прав сервисному слою
        account = account_service.create_account(
            db=db, 
            account_in=account_in, 
            user_id=current_user.id
        )
        return account
    except crud.WorkspaceAccessDenied as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        # Логируем ошибку
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Произошла непредвиденная ошибка.")


@router.get("/", response_model=List[schemas.Account])
def read_accounts(
    *,
    # Используем зависимость, чтобы получить workspace и сразу проверить права
    workspace: models.Workspace = Depends(get_workspace_from_path),
    db: Session = Depends(get_db),
) -> Any:
    """
    Получить список счетов для указанного рабочего пространства.
    """
    # Теперь, когда зависимость отработала, мы уверены, что пользователь
    # имеет доступ к этому workspace. Ручная проверка больше не нужна.
    return crud.account.get_multi_by_workspace(db, workspace_id=workspace.id)


@router.get("/{account_id}", response_model=schemas.Account)
def read_account(
    *,
    # Эта зависимость идеальна, она находит счет и проверяет права. Оставляем ее.
    account: models.Account = Depends(get_account_for_user),
) -> Any:
    """
    Получить информацию о счете по ID.
    """
    return account


@router.put("/{account_id}", response_model=schemas.Account)
def update_account(
    *,
    db: Session = Depends(get_db),
    account_in: schemas.AccountUpdate,
    # Здесь также используется правильная зависимость
    account: models.Account = Depends(get_account_for_user),
) -> Any:
    """
    Обновить счет.
    """
    # Логика обновления проста, сервис пока не нужен.
    # CRUDBase.update не делает commit, поэтому нужно вызвать его явно.
    updated_account = crud.account.update(db=db, db_obj=account, obj_in=account_in)
    db.commit()
    db.refresh(updated_account)
    return updated_account


@router.delete("/{account_id}", response_model=schemas.Account)
def delete_account(
    *,
    db: Session = Depends(get_db),
    account: models.Account = Depends(get_account_for_user),
) -> Any:
    """
    Удалить счет.
    (Внимание: нет логики проверки, что на счете нет транзакций!)
    """
    # TODO: Добавить в сервисный слой проверку, что на счете нет транзакций
    # или что баланс равен нулю, прежде чем удалять.
    if account.balance != 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя удалить счет с ненулевым балансом."
        )
        
    deleted_account = crud.account.remove(db=db, id=account.id)
    db.commit()
    return deleted_account