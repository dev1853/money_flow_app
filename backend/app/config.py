# backend/app/config.py

import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
BASE_DIR: Path = Path(__file__).resolve().parent.parent 
# Путь к директории 'app' внутри backend
APP_DIR = os.path.join(BASE_DIR, 'app')

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
    
    DEFAULT_DDS_ARTICLES_PATH: str = str(BASE_DIR / "app" / "default_dds_articles.json") 
    # default_transactions.json находится в backend/app/
    DEFAULT_TRANSACTIONS_PATH: str = str(BASE_DIR / "app" / "default_transactions.json")
    # dds_keyword_mapping_rules.json находится непосредственно в backend/
    DEFAULT_MAPPING_RULES_PATH: str = str(BASE_DIR / "dds_keyword_mapping_rules.json")
    # Пример для URL базы данных, если вы хотите управлять им здесь
    # DATABASE_URL: str = "postgresql://user:password@host:port/dbname"

    # Конфигурация для pydantic-settings (загрузка из .env файла)
    # model_config = SettingsConfigDict(env_file=".env", extra='ignore') # Для Pydantic v2
    class Config: # Для Pydantic v1
        env_file = ".env"
        extra = 'ignore' # Игнорировать дополнительные поля в .env, если они есть

# Создаем экземпляр настроек, который будет импортироваться в других модулях
settings = Settings()