# backend/app/crud_workspace.py

from __future__ import annotations
from sqlalchemy.orm import Session
from fastapi import HTTPException, status # Импортируем status
from typing import List, Optional

from .. import models, schemas # schemas импортируется здесь

def get_workspace(db: Session, workspace_id: int):
    return db.query(models.Workspace).filter_by(id=workspace_id).first()

def create_workspace_for_user(db: Session, workspace: schemas.WorkspaceCreate, user_id: int):
    db_workspace = models.Workspace(**workspace.model_dump(), owner_id=user_id) # Используем .model_dump()
    db.add(db_workspace)
    db.commit()
    db.refresh(db_workspace)
    return db_workspace

def get_workspaces_for_user(db: Session, user_id: int):
    return db.query(models.Workspace).filter(models.Workspace.owner_id == user_id).all()

def validate_workspace_owner(db: Session, workspace_id: int, user_id: int):
    workspace = db.query(models.Workspace).filter_by(id=workspace_id, owner_id=user_id).first()
    if not workspace:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ к рабочему пространству запрещен")
    return workspace

# НОВАЯ ФУНКЦИЯ: Валидация владения объектами в рабочем пространстве
def validate_workspace_ownership_for_ids(
    db: Session,
    workspace_id: int,
    user_id: int,
    account_ids: Optional[List[int]] = None,
    dds_article_ids: Optional[List[int]] = None
):
    # Проверяем, что рабочее пространство принадлежит пользователю
    validate_workspace_owner(db, workspace_id, user_id)

    # Проверяем владение счетами
    if account_ids:
        db_accounts = db.query(models.Account).filter(
            models.Account.id.in_(account_ids),
            models.Account.workspace_id == workspace_id,
            models.Account.owner_id == user_id # Дополнительная проверка владельца
        ).all()
        if len(db_accounts) != len(account_ids):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Один или несколько счетов не принадлежат этому рабочему пространству или вам")

    # Проверяем владение статьями ДДС
    if dds_article_ids:
        db_dds_articles = db.query(models.DDSArticle).filter(
            models.DDSArticle.id.in_(dds_article_ids),
            models.DDSArticle.workspace_id == workspace_id,
            models.DDSArticle.owner_id == user_id # Дополнительная проверка владельца
        ).all()
        if len(db_dds_articles) != len(dds_article_ids):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Одна или несколько статей ДДС не принадлежат этому рабочему пространству или вам")