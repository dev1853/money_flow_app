# backend/app/security.py

from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

# Настройки для хэширования паролей
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Секретный ключ и алгоритм для JWT токенов
# ВАЖНО: В реальном приложении этот ключ нужно генерировать и хранить в секрете!
SECRET_KEY = "your-super-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверяет, соответствует ли обычный пароль хэшированному."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Возвращает хэш для пароля."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Создает JWT токен."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt