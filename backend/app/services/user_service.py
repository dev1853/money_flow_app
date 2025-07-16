# backend/app/services/user_service.py

from sqlalchemy.orm import Session
from app import crud, schemas
from app.models.role import Role
from app.models.workspace import Workspace
from app.models.account import Account
from app.config import settings
from app.security import get_password_hash
from app.services.onboarding_service import onboarding_service

class UserService:
    def create_user_with_onboarding(self, db: Session, *, user_in: schemas.UserCreate) -> crud.user.model: # type: ignore
        """
        Создает нового пользователя и все необходимые для него начальные сущности.
        """
        # Проверяем и создаем роль "user", если ее нет
        user_role_id = 2
        role = db.query(Role).filter(Role.id == user_role_id).first()
        if not role:
            db_role = Role(id=user_role_id, name="user", description="Regular User")
            db.add(db_role)
            db.flush()

        # Присваиваем ID роли и создаем пользователя
        user_in.role_id = user_role_id
        user = crud.user.create(db, obj_in=user_in)
        db.flush()

        # Создаем рабочее пространство
        workspace_in = schemas.WorkspaceCreate(name="Основное пространство", owner_id=user.id)
        workspace = crud.workspace.create_with_owner(db, obj_in=workspace_in, owner_id=user.id)
        db.flush()

        # Устанавливаем созданное рабочее пространство как активное
        user.active_workspace_id = workspace.id
        db.add(user)

        # Создаем стандартные счета
        accounts_to_create = [
            schemas.AccountCreate(name="Наличные", initial_balance=0, currency="RUB", account_type_id=1, workspace_id=workspace.id),
            schemas.AccountCreate(name="Банковский счет", initial_balance=0, currency="RUB", account_type_id=2, workspace_id=workspace.id)
        ]
        for acc_in in accounts_to_create:
            # Используем только create_with_owner, который корректно обрабатывает initial_balance
            crud.account.create_with_owner(db, obj_in=acc_in, owner_id=user.id)

        # Вызов онбординга для создания статей, счетов, транзакций и правил
        onboarding_service.onboard_user(db, user=user)

        # Сохраняем все изменения одной транзакцией
        db.commit()
        db.refresh(user)
        return user

user_service = UserService()