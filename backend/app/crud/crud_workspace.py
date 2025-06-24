# backend/app/crud/crud_workspace.py

from sqlalchemy.orm import Session
from fastapi import HTTPException, status 
from typing import List, Optional
from fastapi.encoders import jsonable_encoder

from .. import models, schemas
from .base import CRUDBase


class CRUDWorkspace(CRUDBase[models.Workspace, schemas.WorkspaceCreate, schemas.WorkspaceUpdate]):
    def create_for_owner(self, db: Session, obj_in: schemas.WorkspaceCreate, owner_id: int) -> models.Workspace:
        db_obj = models.Workspace(**obj_in.dict(), owner_id=owner_id) 
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def is_owner_or_member(self, db: Session, *, workspace_id: int, user_id: int) -> bool:
        """
        Проверяет, является ли пользователь владельцем рабочего пространства.
        (В будущем можно расширить для проверки членства в команде).
        """
        # Получаем рабочее пространство по его ID
        workspace = self.get(db=db, id=workspace_id)
        # Если воркспейс не найден, доступа нет
        if not workspace:
            return False
        # Возвращаем True, если ID пользователя совпадает с ID владельца воркспейса
        return workspace.owner_id == user_id

    def create_with_owner(
        self, db: Session, *, obj_in: schemas.WorkspaceCreate, owner_id: int
    ) -> models.Workspace:
        """
        Создает рабочее пространство с указанием ID владельца.
        """
        obj_in_data = jsonable_encoder(obj_in)
        # При создании объекта модели мы явно передаем owner_id
        db_obj = self.model(**obj_in_data, owner_id=owner_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi_by_owner(
        self, db: Session, owner_id: int, skip: int = 0, limit: int = 100
    ) -> List[models.Workspace]: 
        return db.query(self.model).filter(models.Workspace.owner_id == owner_id).offset(skip).limit(limit).all()

    def validate_workspace_owner(self, db: Session, workspace_id: int, user_id: int):
        workspace_obj = db.query(self.model).filter(self.model.id == workspace_id, self.model.owner_id == user_id).first()
        if not workspace_obj:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ к рабочему пространству запрещен")
        return workspace_obj
    
    # ПЕРЕМЕЩЕННАЯ И ИЗМЕНЕННАЯ ФУНКЦИЯ is_owner
    def is_owner(self, db: Session, workspace_id: int, user_id: int) -> bool:
        """
        Проверяет, является ли пользователь владельцем указанного рабочего пространства.
        """
        return db.query(self.model).filter(self.model.id == workspace_id, self.model.owner_id == user_id).first() is not None


workspace = CRUDWorkspace(models.Workspace)
