# backend/app/crud/crud_user.py

from sqlalchemy.orm import Session
from typing import Optional
from .base import CRUDBase
from app import models, schemas, security

class CRUDUser(CRUDBase[models.User, schemas.UserCreate, schemas.UserUpdate]):
    def get_by_email(self, db: Session, *, email: str) -> Optional[models.User]:
        return db.query(self.model).filter(self.model.email == email).first()

    # Метод create теперь переопределен только для хэширования пароля
    def create(self, db: Session, *, obj_in: schemas.UserCreate) -> models.User:
        create_data = obj_in.dict()
        password = create_data.pop("password")
        # Убираем поля, которых нет в модели User
        create_data.pop("role_id", None) 
        
        db_obj = self.model(
            **create_data,
            hashed_password=security.get_password_hash(password),
            role_id=2 # Устанавливаем роль по умолчанию
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def authenticate(self, db: Session, *, email: str, password: str) -> Optional[models.User]:
        user = self.get_by_email(db, email=email)
        if not user or not security.verify_password(password, user.hashed_password):
            return None
        return user

user = CRUDUser(models.User)