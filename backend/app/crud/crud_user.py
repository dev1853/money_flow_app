# backend/app/crud/crud_user.py

from typing import Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.security import get_password_hash

class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def get_by_username(self, db: Session, *, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()

    # --- ВОТ ГЛАВНОЕ ИСПРАВЛЕНИЕ ---
    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        """
        Создает нового пользователя, хешируя пароль перед сохранением.
        """
        # Преобразуем Pydantic-схему в словарь
        create_data = obj_in.model_dump()
        # Извлекаем и удаляем пароль из словаря
        password = create_data.pop("password")
        # Хешируем пароль
        hashed_password = get_password_hash(password)
        # Создаем объект модели SQLAlchemy, добавляя захешированный пароль
        db_obj = self.model(**create_data, password_hash=hashed_password)

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def set_active_workspace(self, db, user, workspace):
        user.active_workspace_id = workspace.id
        db.add(user)
        db.flush()

user = CRUDUser(User)