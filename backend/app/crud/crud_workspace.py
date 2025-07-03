# backend/app/crud/crud_workspace.py

from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status 
from typing import List, Optional, Any
from fastapi.encoders import jsonable_encoder
import datetime 

from .base import CRUDBase
from .. import models, schemas


class CRUDWorkspace(CRUDBase[models.Workspace, schemas.WorkspaceCreate, schemas.WorkspaceUpdate]):
    __table_args__ = {'extend_existing': True} 

    def create_with_owner(
        self, db: Session, *, obj_in: schemas.WorkspaceCreate, owner_id: int
    ) -> models.Workspace:
        obj_in_data = obj_in.model_dump() 
        db_obj = self.model(**obj_in_data)
        
        db_obj.owner_id = owner_id 
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj) 
        return db_obj

    def get_multi_by_owner(
        self, db: Session, owner_id: int, skip: int = 0, limit: int = 100
    ) -> List[models.Workspace]: 
        workspaces = db.query(self.model).filter(models.Workspace.owner_id == owner_id).offset(skip).limit(limit).all()
        
        return workspaces
    
    def validate_workspace_owner(self, db: Session, workspace_id: int, user_id: int):
        """
        Проверяет, является ли пользователь владельцем указанного рабочего пространства.
        Если нет, генерирует HTTPException 403 Forbidden.
        """
        workspace_obj = db.query(self.model).filter(self.model.id == workspace_id, self.model.owner_id == user_id).first()
        if not workspace_obj:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступ к рабочему пространству запрещен или оно не найдено.")
        return workspace_obj

    def is_owner(self, db: Session, workspace_id: int, user_id: int) -> bool:
        """
        Проверяет, является ли пользователь владельцем указанного рабочего пространства.
        """
        return db.query(self.model).filter(self.model.id == workspace_id, self.model.owner_id == user_id).first() is not None

    # НОВЫЙ МЕТОД: is_owner_or_member
    def is_owner_or_member(self, db: Session, *, workspace_id: int, user_id: int) -> bool:
        """
        Проверяет, является ли пользователь владельцем или членом рабочего пространства.
        Сейчас просто обертка над is_owner, в будущем можно расширить для членства.
        """
        # Пока что логика такая же, как у is_owner
        return self.is_owner(db, workspace_id=workspace_id, user_id=user_id)


workspace = CRUDWorkspace(models.Workspace)