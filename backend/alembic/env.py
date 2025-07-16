import os
import sys
from logging.config import fileConfig
from dotenv import load_dotenv

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# --- ШАГ 1: Загружаем переменные окружения ---
# Надежно находим и загружаем файл .env из корневой папки бэкенда.
# Это гарантирует, что переменная SQLALCHEMY_DATABASE_URL будет доступна.
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
else:
    print(f"ПРЕДУПРЕЖДЕНИЕ: .env файл не найден по пути {dotenv_path}")


# --- ШАГ 2: Добавляем путь к нашему приложению (папку backend) ---
# Это нужно, чтобы Python мог найти и импортировать 'app.models' и 'app.database'.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# --- ШАГ 3: Настраиваем конфигурацию Alembic ---
# Это стандартный объект конфигурации Alembic.
config = context.config

# Получаем URL базы данных, который мы загрузили из .env,
# и устанавливаем его как основную опцию для Alembic.
sqlalchemy_url = os.getenv("SQLALCHEMY_DATABASE_URL")
if sqlalchemy_url:
    config.set_main_option("sqlalchemy.url", sqlalchemy_url)
else:
    # Эта ошибка теперь не должна появляться, но оставляем ее для диагностики.
    raise ValueError("Не удалось найти SQLALCHEMY_DATABASE_URL в .env файле!")

# Подключаем логирование.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# --- ШАГ 4: Указываем Alembic, какие модели отслеживать ---
# Импортируем базовый класс и все модели, чтобы Alembic их "увидел".
from app.database import Base
from app import models  # <-- Обязательно импортируем все модели.

# Устанавливаем метаданные наших моделей как цель для автогенерации миграций.
target_metadata = Base.metadata

# --- ДАЛЕЕ ИДЕТ СТАНДАРТНЫЙ КОД ALEMBIC БЕЗ ИЗМЕНЕНИЙ ---

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()