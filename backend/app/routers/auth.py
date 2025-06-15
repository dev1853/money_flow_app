# backend/app/routers/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from .. import schemas, crud, security
from ..dependencies import get_db, get_current_user # Убедись, что get_current_user здесь

router = APIRouter(
    prefix="/auth", # Префикс для всех роутов в этом файле будет /api/auth
    tags=["Auth"]
)

@router.post("/login", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неактивный пользователь",
        )

    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Эндпоинт для регистрации. Он НЕ ДОЛЖЕН БЫТЬ ЗАЩИЩЕН АУТЕНТИФИКАЦИЕЙ.
# Если RegisterPage отправляет POST /api/users, то этот эндпоинт не будет использоваться.
# Он будет в users.py. Этот роут здесь только если ты хочешь его использовать как /api/auth/register
@router.post("/register", response_model=schemas.User, status_code=201)
def register_user_auth(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email) or crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Пользователь с таким email или именем пользователя уже зарегистрирован")
    return crud.create_user(db=db, user=user)