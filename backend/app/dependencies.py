# backend/app/dependencies.py

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from . import crud, models, schemas, security
from .database import SessionLocal

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Используем security.SECRET_KEY и security.ALGORITHM
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=email)
    except JWTError:
        raise credentials_exception
    
    user = crud.user.get_by_email(db, email=token_data.username)
    
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_current_active_superuser(current_user: models.User = Depends(get_current_active_user)):
    if not current_user.is_superuser: 
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="У пользователя недостаточно прав"
        )
    return current_user

def get_article_for_user(
    *,
    db: Session = Depends(get_db),
    article_id: int,
    current_user: models.User = Depends(get_current_active_user),
) -> models.DdsArticle:
    """
    Получает статью по ID и проверяет, что она принадлежит
    рабочему пространству, к которому у пользователя есть доступ.
    """
    article = crud.dds_article.get(db=db, id=article_id)
    if not article:
        raise HTTPException(status_code=404, detail="DDS Article not found")
    
    # Проверяем права доступа через уже существующую CRUD-функцию
    if not crud.workspace.is_owner_or_member(
        db=db, workspace_id=article.workspace_id, user_id=current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not enough permissions for this article")
        
    return article

def get_workspace_for_user(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> models.Workspace:
    """
    Находит рабочее пространство и проверяет, что оно принадлежит текущему пользователю.
    """
    workspace = crud.workspace.get(db=db, id=workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return workspace

def get_account_for_user(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> models.Account:
    """
    Находит счет и проверяет, что он принадлежит рабочему пространству текущего пользователя.
    """
    account = crud.account.get(db=db, id=account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    # Проверяем права через родительский воркспейс
    if account.workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return account

def get_dds_article_for_user(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> models.DdsArticle:
    """
    Находит статью ДДС и проверяет права доступа.
    """
    article = crud.dds_article.get(db=db, id=article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    if article.workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return article

def get_transaction_for_user(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> models.Transaction:
    """
    Находит транзакцию и проверяет права доступа.
    """
    transaction = crud.transaction.get(db=db, id=transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if transaction.account.workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return transaction