# backend/app/crud/crud_user.py

from typing import Optional # Optional нужен для get_by_email
from sqlalchemy.orm import Session

from .base import CRUDBase
from .. import models, schemas
from ..security import get_password_hash

class CRUDUser(CRUDBase[models.User, schemas.UserCreate, schemas.UserUpdate]):
    """
    CRUD операции для модели User с дополнительными методами.
    """
    def get_by_email(self, db: Session, *, email: str) -> Optional[models.User]:
        """Получить пользователя по email."""
        return db.query(self.model).filter(models.User.email == email).first()

    def create(self, db: Session, *, obj_in: schemas.UserCreate, hashed_password: str) -> models.User:
        """
        Создает объект пользователя, принимая УЖЕ хешированный пароль.
        """
        db_obj = self.model(
            email=obj_in.email,
            username=obj_in.username,
            password_hash=hashed_password,
            full_name=obj_in.full_name,
            is_active=True,
            is_superuser=False,
            role_id=2
        )
        db.add(db_obj)
        return db_obj

    def is_superuser(self, user: models.User) -> bool:
        """Проверяет, является ли пользователь суперпользователем."""
        return user.is_superuser

    def set_active_workspace(self, db: Session, *, user: models.User, workspace: models.Workspace) -> models.User:
        """
        Устанавливает активное рабочее пространство для пользователя.
        Не делает commit.
        """
        user.active_workspace_id = workspace.id
        db.add(user)
        return user

# Создаем единственный экземпляр класса для импорта
user = CRUDUser(models.User)