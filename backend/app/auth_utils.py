import os
from datetime import datetime, timedelta, timezone
from typing import Optional

# Импорт из FastAPI
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# Импорт из SQLAlchemy
from sqlalchemy.orm import Session

# Импорт из сторонних библиотек
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from dotenv import load_dotenv

# Импорт из локальных модулей
from app.database import SessionLocal # Предполагаем, что SessionLocal находится здесь.
                                    # Если get_db находится в main.py, возможно, его нужно импортировать оттуда.
from . import models, crud


# Загружаем переменные окружения из файла .env
# Это нужно сделать до того, как мы попытаемся получить доступ к os.getenv()
load_dotenv()

# --- КОНСТАНТЫ БЕЗОПАСНОСТИ И JWT ---
# Секретный ключ для подписи JWT. **КРИТИЧЕСКИ ВАЖНО: ЗАМЕНИТЕ ЭТО В ПРОДАКШЕНЕ!**
# Используйте генератор случайных ключей, например: `openssl rand -hex 32` или Python's `secrets.token_hex(32)`
SECRET_KEY = os.getenv("SECRET_KEY")

# Алгоритм хеширования для JWT.
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# Время жизни токена доступа в минутах.
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Проверка наличия SECRET_KEY
if not SECRET_KEY:
    error_message = (
        "ОШИБКА: SECRET_KEY не установлен в переменных окружения или .env файле! "
        "Аутентификация не будет работать корректно. "
        "В продакшен-среде это должно быть фатальной ошибкой."
    )
    print(error_message)
    # В продакшен-среде здесь лучше возбуждать исключение, чтобы остановить запуск:
    # raise ValueError(error_message)


# Контекст для хеширования паролей с использованием bcrypt.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Схема OAuth2 для получения токена из заголовка Authorization: Bearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


# --- Pydantic модели ---
class TokenData(BaseModel):
    """
    Pydantic модель для данных, ожидаемых внутри JWT токена.
    Обычно содержит 'sub' (subject, имя пользователя или ID).
    """
    username: Optional[str] = None


# --- Вспомогательная функция для получения сессии БД ---
def get_db():
    """
    Dependency для получения сессии базы данных.
    Должна быть определена один раз в приложении и использоваться как зависимость.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- Функции для работы с паролями ---
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Проверяет, соответствует ли предоставленный обычный пароль
    ранее хешированному паролю.
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Создает хеш из обычного пароля для безопасного хранения.
    """
    return pwd_context.hash(password)


# --- Функции аутентификации пользователя ---
def authenticate_user(db: Session, username: str, password: str) -> Optional[models.User]:
    """
    Проверяет учетные данные пользователя.
    Находит пользователя по имени, проверяет активность и пароль.
    Возвращает объект User в случае успеха, иначе None.
    """
    user = crud.get_user_by_username(db, username=username)
    if not user:
        return None  # Пользователь не найден
    if not user.is_active:
        return None  # Пользователь неактивен
    if not verify_password(password, user.password_hash):
        return None  # Неверный пароль
    return user  # Успешная аутентификация


# --- Функции для работы с JWT токенами ---
# Стандартное исключение для проблем с аутентификацией
CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Не удалось проверить учетные данные",
    headers={"WWW-Authenticate": "Bearer"},
)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Создает JWT токен доступа.
    `data` должен содержать 'sub' (subject), обычно это имя пользователя или ID.
    `expires_delta` (опционально) - кастомное время жизни токена.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Проверка, что 'sub' присутствует
    if "sub" not in to_encode or not to_encode["sub"]:
        raise ValueError("JWT data must contain a 'sub' (subject) key.")

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    """
    Извлекает текущего аутентифицированного пользователя из JWT токена.
    Возбуждает HTTPException 401, если токен невалиден или пользователь не найден/неактивен.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: Optional[str] = payload.get("sub")
        if username is None:
            raise CREDENTIALS_EXCEPTION
        token_data = TokenData(username=username)
    except JWTError:
        raise CREDENTIALS_EXCEPTION
    
    user = crud.get_user_by_username(db, username=token_data.username)
    if user is None:
        raise CREDENTIALS_EXCEPTION
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Неактивный пользователь")
    return user


async def get_current_workspace_id(current_user: models.User = Depends(get_current_user)) -> int:
    """
    Возвращает workspace_id текущего аутентифицированного пользователя.
    Возбуждает HTTPException 403, если пользователь не связан с рабочим пространством.
    """
    if not current_user.workspace_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Пользователь не связан с рабочим пространством."
        )
    return current_user.workspace_id

async def get_current_active_user(current_user: models.User = Depends(get_current_user)) -> models.User:
    """
    Проверяет, что текущий пользователь активен.
    """
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Неактивный пользователь")
    return current_user

async def get_current_admin_user(current_user: models.User = Depends(get_current_active_user)) -> models.User:
    """
    Проверяет, что текущий пользователь является администратором (role_id = 1).
    """
    # Предполагаем, что ID=1 это 'admin'. Убедись, что это соответствует твоей базе данных.
    if not current_user.role_id or current_user.role_id != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав. Требуется доступ администратора."
        )
    return current_user