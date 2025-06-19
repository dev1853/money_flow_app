from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.dependencies import get_db, get_current_user, get_current_active_superuser

router = APIRouter(
    tags=["users"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.User)
def create_user(
    *,
    db: Session = Depends(get_db),
    user_in: schemas.UserCreate,
) -> Any:
    """
    Create new user and trigger the onboarding process.
    """
    user = crud.user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    # 1. Создаем пользователя
    user = crud.user.create(db, obj_in=user_in)

    # 2. Вызываем централизованную функцию онбординга
    # Она сделает все остальное: создаст воркспейс, счета, статьи и т.д.
    crud.onboarding.onboard_new_user(db=db, user=user)
    
    # 3. Обновляем объект пользователя из БД, чтобы получить active_workspace_id
    db.refresh(user)
    
    return user

# Этот эндпоинт ЗАЩИЩЕННЫЙ
@router.get("/me", response_model=schemas.User)
def read_user_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.get("/", response_model=List[schemas.User])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_superuser),
):
    users = crud.user.get_multi(db, skip=skip, limit=limit)
    return users