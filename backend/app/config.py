# backend/app/config.py

# Для Pydantic v2: pip install pydantic-settings
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Этот класс определяет все конфигурационные параметры вашего приложения.
    # Pydantic-settings автоматически загружает их из переменных окружения
    # или из файла .env.

    # Ключ для подписи JWT-токенов.
    # В продакшене ОБЯЗАТЕЛЬНО измените это на длинную случайную строку!
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_GOES_HERE_REPLACE_ME_IN_PRODUCTION"
    # Алгоритм шифрования JWT
    ALGORITHM: str = "HS256"
    # Время жизни токена доступа в минутах
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Пример для URL базы данных, если вы хотите управлять им здесь
    # DATABASE_URL: str = "postgresql://user:password@host:port/dbname"

    # Конфигурация для pydantic-settings (загрузка из .env файла)
    # model_config = SettingsConfigDict(env_file=".env", extra='ignore') # Для Pydantic v2
    class Config: # Для Pydantic v1
        env_file = ".env"
        extra = 'ignore' # Игнорировать дополнительные поля в .env, если они есть

# Создаем экземпляр настроек, который будет импортироваться в других модулях
settings = Settings()