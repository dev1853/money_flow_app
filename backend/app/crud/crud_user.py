# backend/app/crud_user.py

from __future__ import annotations
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import models, security, schemas

# Явные импорты из других CRUD модулей
from .crud_workspace import create_workspace_for_user
from .crud_dds_article import create_default_dds_articles
from .crud_account import create_default_accounts


def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        hashed_password=hashed_password,
        role_id=user.role_id,
        is_active=user.is_active
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    default_workspace_schema = schemas.WorkspaceCreate(name=f"Пространство {db_user.username}")
    db_workspace = create_workspace_for_user(db=db, workspace=default_workspace_schema, user_id=db_user.id) # Вызываем напрямую
    
    create_default_dds_articles(db=db, workspace_id=db_workspace.id, user_id=db_user.id) # Вызываем напрямую
    create_default_accounts(db=db, workspace_id=db_workspace.id, user_id=db_user.id) # Вызываем напрямую

    return db_user

def update_user(db: Session, db_user: models.User, user_update: schemas.UserUpdate):
    update_data = user_update.model_dump(exclude_unset=True) 
    for key, value in update_data.items():
        setattr(db_user, key, value)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db.delete(db_user)
        db.commit()
    return db_user