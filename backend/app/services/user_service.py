# /backend/app/services/user_service.py

from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..core.exceptions import UserAlreadyExistsError
from ..security import get_password_hash

class UserService:
    def create_user_with_onboarding(self, db: Session, *, user_in: schemas.UserCreate) -> models.User:
        if crud.user.get_by_email(db, email=user_in.email):
            raise UserAlreadyExistsError(email=user_in.email)

        hashed_password = get_password_hash(user_in.password)

        # --- КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ ---
        # Создаем копию объекта для изменения, чтобы не трогать оригинал
        user_to_create = user_in.model_copy()
        # Если username не пришел, устанавливаем его равным email
        if not user_to_create.username:
            user_to_create.username = user_to_create.email
        
        try:
            # 1. Создаем пользователя, явно передавая хеш
            user = crud.user.create(
                db=db, 
                obj_in=user_to_create, 
                hashed_password=hashed_password
            )

            # 2. "Сбрасываем" сессию в БД, чтобы получить user.id
            db.flush()

            # 3. Теперь user.id не None, и мы можем безопасно вызвать онбординг
            crud.onboarding.onboard_new_user(db=db, user=user)

            # 4. Фиксируем всю транзакцию
            db.commit()
            
            # 5. Обновляем объект из БД
            db.refresh(user)
            
            return user
        except Exception as e:
            db.rollback()
            print(f"ERROR during user creation: {e}")
            raise

user_service = UserService()