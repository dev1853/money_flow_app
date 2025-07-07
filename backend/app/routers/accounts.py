# app/routers/accounts.py
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.dependencies import (
    get_db,
    get_current_active_user,
    get_account_for_user,
)
from app.services.account_service import account_service
from app.core.exceptions import PermissionDeniedError, AccountDeletionError

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
    """Создает новый счет в указанном рабочем пространстве."""
    try:
        account = account_service.create_account(
            db=db, account_in=account_in, user_id=current_user.id
        )
        db.commit()
        db.refresh(account)
        return account
    except PermissionDeniedError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.detail)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Произошла непредвиденная ошибка.")

@router.get("/", response_model=List[schemas.Account])
def read_accounts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Получает список счетов для активного рабочего пространства."""
    if not current_user.active_workspace_id:
        return []
    return crud.account.get_multi_by_workspace(
        db, workspace_id=current_user.active_workspace_id, skip=skip, limit=limit
    )

@router.get("/{account_id}", response_model=schemas.Account)
def read_account(account: models.Account = Depends(get_account_for_user)) -> Any:
    """Получить информацию о счете по ID."""
    return account

@router.put("/{account_id}", response_model=schemas.Account)
def update_account(
    *,
    db: Session = Depends(get_db),
    account_in: schemas.AccountUpdate,
    account: models.Account = Depends(get_account_for_user),
) -> Any:
    """Обновить счет."""
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
    """Удалить счет."""
    try:
        # --- ИЗМЕНЕНИЕ ЗДЕСЬ ---
        # Вся логика теперь в сервисе
        deleted_account = account_service.delete_account(db=db, account_to_delete=account)
        db.commit()
        return deleted_account
    except AccountDeletionError as e:
        db.rollback()
        # Превращаем бизнес-ошибку в корректный HTTP-ответ
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.detail)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Произошла непредвиденная ошибка.")
    
@router.delete("/{account_id}", response_model=schemas.Account)
def archive_account( # Функция переименована, чтобы отразить ее новое назначение
    *,
    db: Session = Depends(get_db),
    account: models.Account = Depends(get_account_for_user),
) -> Any:
    """Архивировать счет (установить is_active=False) вместо удаления."""
    try:
        # Вызываем новый метод archive_account из сервиса
        archived_account = account_service.archive_account(db=db, account_to_archive=account)
        db.commit()
        db.refresh(archived_account) # Обновляем объект, чтобы он отражал новое состояние is_active
        return archived_account
    except AccountDeletionError as e: # Исключение оставлено для обратной совместимости, если нужна специфичная ошибка
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.detail)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Произошла непредвиденная ошибка.")