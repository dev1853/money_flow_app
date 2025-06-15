from __future__ import annotations
from sqlalchemy.orm import Session

from .. import models

def get_workspace(db: Session, workspace_id: int):
    return db.query(models.Workspace).filter_by(id=workspace_id).first()

def create_workspace_for_user(db: Session, workspace: 'schemas.WorkspaceCreate', user_id: int):
    from .. import schemas
    db_workspace = models.Workspace(**workspace.dict(), owner_id=user_id)
    db.add(db_workspace)
    db.commit()
    db.refresh(db_workspace)
    return db_workspace

def get_workspaces_for_user(db: Session, user_id: int):
    return db.query(models.Workspace).filter(models.Workspace.owner_id == user_id).all()

def validate_workspace_owner(db: Session, workspace_id: int, user_id: int):
    from ..auth_utils import HTTPException # Локальный импорт, чтобы избежать циклов
    workspace = db.query(models.Workspace).filter_by(id=workspace_id, owner_id=user_id).first()
    if not workspace:
        raise HTTPException(status_code=403, detail="Доступ к рабочему пространству запрещен")
    return workspace