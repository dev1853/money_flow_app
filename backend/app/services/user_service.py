# /backend/app/services/user_service.py

from sqlalchemy.orm import Session
import logging

from app import crud, models, schemas
from ..core.exceptions import UserAlreadyExistsError
from ..security import get_password_hash
from .onboarding_service import onboarding_service 

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
            # 1. Создаем пользователя
            user = crud.user.create(
                db=db, 
                obj_in=user_to_create, 
                hashed_password=hashed_password
            )
            db.flush() # Получаем user.id

            # 2. ВЫЗЫВАЕМ НОВЫЙ СЕРВИС ОДНОЙ СТРОКОЙ
            onboarding_service.onboard_user(db=db, user=user)

            # 3. Фиксируем всю транзакцию
            db.commit()
            db.refresh(user)
            return user
        except Exception as e: # <--- Ловим исключение в переменную 'e'
            # ДОБАВЛЯЕМ ЭТИ СТРОКИ
            logging.error(f"ERROR during user creation: {e}", exc_info=True)
            # или для быстрой отладки:
            # print(f"ERROR in user_service: {e}")
            # print(traceback.format_exc()) # не забудьте import traceback
            
            db.rollback()
            raise

user_service = UserService()