# app/auth_utils.py
import os
from datetime import datetime, timedelta, timezone # Для работы со временем и часовыми поясами (важно для срока действия токена)
from typing import Optional # Для указания, что функция может вернуть None

from jose import JWTError, jwt # Библиотека для создания и проверки JWT токенов
from passlib.context import CryptContext # Библиотека для хеширования и проверки паролей
from pydantic import BaseModel # Для определения структуры данных токена
from dotenv import load_dotenv # Для загрузки переменных из .env файла

from sqlalchemy.orm import Session # Для типизации сессии базы данных в authenticate_user
from . import models, crud       # Для доступа к модели User и CRUD-функции get_user_by_username

# Загружаем переменные окружения из файла .env
# Это нужно сделать до того, как мы попытаемся получить доступ к os.getenv() для наших настроек
load_dotenv()

# --- НАСТРОЙКИ БЕЗОПАСНОСТИ И JWT ---
# Секретный ключ для подписи JWT. Должен быть сложным и храниться в секрете!
# Читаем из переменных окружения.
SECRET_KEY = os.getenv("SECRET_KEY")
# Алгоритм хеширования для JWT.
ALGORITHM = os.getenv("ALGORITHM", "HS256") # Значение по умолчанию, если не задано в .env
# Время жизни токена доступа в минутах.
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")) # Значение по умолчанию, преобразуем в int

# Критически важно: приложение не должно запускаться без SECRET_KEY
if not SECRET_KEY:
    error_message = "ОШИБКА: SECRET_KEY не установлен в .env файле! Аутентификация не будет работать корректно."
    print(error_message)
    # В продакшен-среде здесь лучше возбуждать исключение, чтобы остановить запуск:
    # raise ValueError(error_message)

# Создаем контекст для passlib, указывая схему хеширования (bcrypt)
# bcrypt - надежный алгоритм для хеширования паролей.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Pydantic модели для данных токена ---
class TokenData(BaseModel):
    """
    Схема для данных, которые мы ожидаем найти внутри JWT токена после декодирования.
    В нашем случае, это имя пользователя (которое мы помещаем в поле 'sub' токена).
    """
    username: Optional[str] = None

# --- Функции для работы с паролями ---
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Проверяет, соответствует ли предоставленный обычный пароль (plain_password)
    ранее сохраненному хешированному паролю (hashed_password).
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Создает хеш из обычного пароля. Этот хеш затем сохраняется в базе данных.
    """
    return pwd_context.hash(password)

# --- Основная функция аутентификации ---
def authenticate_user(db: Session, username: str, password: str) -> Optional[models.User]:
    """
    Аутентифицирует пользователя:
    1. Находит пользователя в базе данных по имени (username).
    2. Если пользователь найден, проверяет предоставленный пароль с хешем из базы.
    3. Дополнительно проверяет, активен ли пользователь.
    Возвращает объект пользователя (models.User) в случае успеха, иначе None.
    """
    user = crud.get_user_by_username(db, username=username)
    if not user:
        return None # Пользователь не найден
    if not user.is_active:
        return None # Пользователь неактивен
    if not verify_password(password, user.password_hash):
        return None # Неверный пароль
    return user # Успешная аутентификация

# --- Функции для работы с JWT токенами ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Создает JWT токен доступа.
    'data' должна содержать ключ 'sub' с идентификатором пользователя (например, username).
    'expires_delta' позволяет указать время жизни токена, отличное от стандартного.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    # Убедимся, что 'sub' (subject/идентификатор пользователя) есть в данных для кодирования
    if "sub" not in to_encode or not to_encode["sub"]:
         raise ValueError("Отсутствует 'sub' (идентификатор пользователя) в данных для создания токена")

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[str]:
    """
    Декодирует JWT токен и возвращает имя пользователя (из поля 'sub').
    Возвращает None, если токен невалиден (например, неверная подпись, истек срок действия, или нет поля 'sub').
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: Optional[str] = payload.get("sub")
        if username is None:
            # Если поле "sub" отсутствует в токене
            return None
        # Проверка срока действия (exp) уже встроена в jwt.decode() и вызовет JWTError, если токен истек.
        return username
    except JWTError: # Ловим любые ошибки при декодировании JWT (неверная подпись, истек срок, неверный формат и т.д.)
        return None