# backend/app/dependencies.py

from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt

# Импортируем из других модулей твоего приложения "app"
from .database import SessionLocal # Для работы с базой данных
from . import crud, models, schemas, security # security для SECRET_KEY и ALGORITHM

# Схема для получения токена OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_db() -> Generator[Session, None, None]:
    """
    Зависимость для получения сессии базы данных.
    Открывает сессию, предоставляет ее, затем закрывает.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    """
    Зависимость для получения текущего аутентифицированного пользователя.
    Декодирует JWT токен и возвращает объект пользователя.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Проверяем наличие SECRET_KEY и ALGORITHM
        if not security.SECRET_KEY or not security.ALGORITHM:
            raise ValueError("SECRET_KEY or ALGORITHM is not set in security module.")

        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    except ValueError as e:
        # Это исключение будет поймано, если SECRET_KEY/ALGORITHM не заданы
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


    user = crud.get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

# Если у тебя есть роли и ты хочешь проверять, что пользователь активен
async def get_current_active_user(current_user: models.User = Depends(get_current_user)) -> models.User:
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user

# Если у тебя есть роли и ты хочешь проверять роль администратора
async def get_current_admin_user(current_user: models.User = Depends(get_current_active_user)) -> models.User:
    # Предполагается, что у твоей модели User есть атрибут role, а у Role есть name
    # ИЛИ что у пользователя есть role_id, по которому можно определить роль "admin" (например, role_id == 1)
    if not current_user.role or current_user.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not an admin user")
    return current_user

async def get_current_active_superuser(
    current_user: models.User = Depends(get_current_active_user),
) -> models.User:
    """
    Проверяет, является ли текущий пользователь суперадминистратором.
    Если нет - выбрасывает ошибку 403 Forbidden.
    """
    # <<< Вот здесь должен быть отступ
    if not crud.user.is_superuser(current_user):
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user