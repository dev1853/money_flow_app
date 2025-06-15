from __future__ import annotations
from sqlalchemy.orm import Session

from .. import models, security

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: 'schemas.UserCreate'):
    from .. import schemas
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        hashed_password=hashed_password # <-- Вы используете это имя
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user