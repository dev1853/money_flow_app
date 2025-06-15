# backend/app/routers/users.py

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, models 
from ..dependencies import get_db, get_current_user # Исправлен относительный импорт

router = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(get_current_user)]
)

@router.get("/", response_model=List[schemas.User])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    # current_user: models.User = Depends(get_current_user)
):
    # if not current_user.role.name == "admin": 
        # raise HTTPException(status_code=403, detail="Not authorized to view users") 

    users = crud.get_users(db, skip=skip, limit=limit) 
    return users

@router.post("", response_model=schemas.User, status_code=201) 
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)): 
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@router.get("/me", response_model=schemas.User) 
async def read_users_me(current_user: models.User = Depends(get_current_user)): 
    return current_user