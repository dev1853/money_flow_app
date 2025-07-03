# /backend/app/routers/auth.py

from datetime import timedelta
from typing import Union

# Импортируем Annotated из typing_extensions для совместимости с Python < 3.9
from typing_extensions import Annotated 

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

# Мы импортируем весь пакет crud
from .. import crud, models, schemas
from ..database import get_db
from ..security import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter()

def authenticate_user(db: Session, username: str, password: str) -> Union[models.User, bool]:
    """
    Функция для аутентификации пользователя.
    Ищет пользователя в БД и проверяет пароль.
    """
    # Ищем пользователя по email
    user = crud.user.get_by_email(db, email=username)
    
    if not user:
        return False
    # Убеждаемся, что в модели User поле называется 'password_hash'
    if not verify_password(password, user.password_hash):
        return False
    return user


@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    # Annotated теперь импортирован из правильного места
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # В subject токена должен быть уникальный идентификатор, email подходит
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}