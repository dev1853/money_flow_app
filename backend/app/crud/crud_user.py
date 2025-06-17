# backend/app/crud/crud_user.py

from sqlalchemy.orm import Session
from typing import Optional

from .base import CRUDBase
from app import models, schemas, security
# Явные импорты, чтобы избежать циклических зависимостей
from app.crud.crud_workspace import workspace as crud_workspace
from app.crud.crud_account import account as crud_account
from app.crud.crud_transaction import transaction as crud_transaction
from app.crud.crud_dds_article import dds_article as crud_dds_article

class CRUDUser(CRUDBase[models.User, schemas.UserCreate, schemas.UserUpdate]):
    def get_by_email(self, db: Session, *, email: str) -> Optional[models.User]:
        return db.query(self.model).filter(self.model.email == email).first()

    def create(self, db: Session, *, obj_in: schemas.UserCreate) -> models.User:
        # 1. Создаем самого пользователя, вызывая метод из CRUDBase
        # Сначала преобразуем Pydantic схему в словарь
        create_data = obj_in.dict()
        # Хэшируем пароль
        create_data["hashed_password"] = security.get_password_hash(create_data.pop("password"))
        # Создаем объект модели
        db_obj = self.model(**create_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        # 2. Создаем для него рабочее пространство по умолчанию
        workspace_schema = schemas.WorkspaceCreate(name="Мое рабочее пространство")
        db_workspace = crud_workspace.create_with_owner(db=db, obj_in=workspace_schema, owner_id=db_obj.id)

        # 3. Создаем статьи ДДС по умолчанию
        crud_dds_article.create_default_articles(db=db, workspace_id=db_workspace.id, owner_id=db_obj.id)
        
        # 4. Создаем счета по умолчанию
        default_accounts = crud_account.create_default_accounts(db=db, workspace_id=db_workspace.id, user_id=db_obj.id)

        # 5. Создаем транзакции по умолчанию
        if default_accounts:
            accounts_map = {acc.name: acc.id for acc in default_accounts}
            crud_transaction.create_default_transactions(db=db, workspace_id=db_workspace.id, user_id=db_obj.id, accounts_map=accounts_map)
            
        return db_obj

    def authenticate(self, db: Session, *, email: str, password: str) -> Optional[models.User]:
        user = self.get_by_email(db, email=email)
        if not user or not security.verify_password(password, user.hashed_password):
            return None
        return user

    def is_superuser(self, user: models.User) -> bool:
        return user.is_superuser

user = CRUDUser(models.User)