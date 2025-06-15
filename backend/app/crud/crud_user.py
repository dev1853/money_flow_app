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
    from .. import schemas, crud # Импортируем весь пакет crud

    # 1. Создаем пользователя
    hashed_password = crud.security.get_password_hash(user.password) # Обращаемся через crud.security
    db_user = crud.models.User(
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
    
    # 2. Создаем для него первое рабочее пространство
    default_workspace_schema = schemas.WorkspaceCreate(name=f"Пространство {db_user.username}")
    db_workspace = crud.create_workspace_for_user(db=db, workspace=default_workspace_schema, user_id=db_user.id)
    
    # 3. Создаем статьи ДДС по умолчанию
    crud.create_default_dds_articles(db=db, workspace_id=db_workspace.id, user_id=db_user.id)
    
    # 4. Создаем счета по умолчанию
    crud.create_default_accounts(db=db, workspace_id=db_workspace.id, user_id=db_user.id)

    return db_user