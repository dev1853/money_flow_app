from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.dependencies import get_db, get_current_user, get_current_active_superuser

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.post("/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)) -> Any:
    db_user = crud.user.get_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Пользователь с таким email уже существует в системе.",
        )
    return crud.user.create(db=db, obj_in=user)

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