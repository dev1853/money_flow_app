# backend/app/crud/crud_workspace.py
from sqlalchemy.orm import Session
from typing import List

from .base import CRUDBase
from app import models, schemas

class CRUDWorkspace(CRUDBase[models.Workspace, schemas.WorkspaceCreate, schemas.WorkspaceUpdate]):
    def create_with_owner(
        self, db: Session, *, obj_in: schemas.WorkspaceCreate, owner_id: int
    ) -> models.Workspace:
        db_obj = self.model(**obj_in.dict(), owner_id=owner_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi_by_owner(
        self, db: Session, *, owner_id: int, skip: int = 0, limit: int = 100
    ) -> List[models.Workspace]:
        return (
            db.query(self.model)
            .filter(models.Workspace.owner_id == owner_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def is_owner(self, db: Session, *, workspace_id: int, user_id: int) -> bool:
        """
        Проверяет, является ли пользователь владельцем рабочего пространства.
        Возвращает True или False.
        """
        db_obj = db.query(self.model).filter(
            models.Workspace.id == workspace_id, self.model.owner_id == user_id
        ).first()
        return db_obj is not None

# Создаем единый экземпляр для импорта
workspace = CRUDWorkspace(models.Workspace)