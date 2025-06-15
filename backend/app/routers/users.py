# backend/app/routers/users.py
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

# ИЗМЕНЕНИЕ: импортируем конкретные схемы
from .. import crud, models, auth_utils
from ..schemas import User, UserCreate
from ..database import get_db

router = APIRouter(
    prefix="/api/users",
    tags=["Users"]
)

@router.post("", response_model=User, status_code=201)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # ... (остальной код без изменений)
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@router.get("/me", response_model=User)
async def read_users_me(current_user: models.User = Depends(auth_utils.get_current_active_user)):
    # ... (остальной код без изменений)
    return current_user