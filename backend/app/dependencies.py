# /backend/app/dependencies.py

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from . import crud, models, schemas, security
from .database import get_db

# Схема остается без изменений
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

# --- СУЩЕСТВУЮЩИЕ ЗАВИСИМОСТИ С НЕБОЛЬШИМИ УЛУЧШЕНИЯМИ ---

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    """
    Декодирует JWT токен, проверяет его валидность и возвращает объект пользователя из БД.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось проверить учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        # Мы используем email в качестве 'sub' в токенах, что является хорошей практикой
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = crud.user.get_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: models.User = Depends(get_current_user)) -> models.User:
    """
    Зависимость, которая возвращает только активных пользователей.
    """
    if not current_user.is_active:
        raise HTTPException(status_code=403, detail="Пользователь неактивен")
    return current_user

# --- НОВЫЕ ЗАВИСИМОСТИ ДЛЯ ПОВЫШЕНИЯ НАДЕЖНОСТИ И ЧИСТОТЫ КОДА ---

def get_current_active_superuser(current_user: models.User = Depends(get_current_active_user)) -> models.User:
    """
    Зависимость, которая требует, чтобы пользователь был активным суперпользователем.
    Идеально для защиты административных эндпоинтов.
    """
    if not crud.user.is_superuser(current_user):
        raise HTTPException(
            status_code=403, detail="Эта операция требует прав администратора"
        )
    return current_user

def get_current_active_workspace(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> models.Workspace:
    """
    Получает активное рабочее пространство для текущего пользователя из его профиля.
    Если активное пространство не установлено, выбрасывает ошибку 400.
    """
    if current_user.active_workspace_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Активное рабочее пространство не выбрано."
        )
    workspace = crud.workspace.get(db, id=current_user.active_workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Активное рабочее пространство с ID {current_user.active_workspace_id} не найдено."
        )
    return workspace

def get_workspace_from_path(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
) -> models.Workspace:
    """
    Находит рабочее пространство по ID из пути URL и проверяет,
    что оно принадлежит текущему пользователю.
    """
    workspace = crud.workspace.get(db, id=workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Рабочее пространство не найдено."
        )
    if workspace.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для доступа к этому рабочему пространству."
        )
    return workspace

# --- ЗАВИСИМОСТИ ДЛЯ ДОСТУПА К РЕСУРСАМ С ОПТИМИЗАЦИЕЙ ---

def get_account_for_user(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> models.Account:
    """
    Находит счет по ID и проверяет, что он принадлежит текущему пользователю.
    """
    account = crud.account.get(db=db, id=account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Счет не найден")
    # УЛУЧШЕНИЕ: Проверяем owner_id напрямую, это эффективнее, чем через workspace
    if account.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Недостаточно прав для доступа к этому счету")
    return account

def get_dds_article_for_user(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> models.DdsArticle:
    """
    Находит статью ДДС и проверяет, что она принадлежит одному из воркспейсов пользователя.
    """
    article = crud.dds_article.get(db=db, id=article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Статья ДДС не найдена")
    # Здесь проверка через workspace оправдана, т.к. у статьи нет прямого owner_id
    if article.workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Недостаточно прав для доступа к этой статье ДДС")
    return article

def get_transaction_for_user(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> models.Transaction:
    """
    Находит транзакцию и проверяет, что она создана текущим пользователем.
    """
    transaction = crud.transaction.get(db=db, id=transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Транзакция не найдена")
    if transaction.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Недостаточно прав для доступа к этой транзакции")
    return transaction