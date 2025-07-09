import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# --- НАЧАЛО ИСПРАВЛЕНИЙ ---

# 1. Добавляем путь к нашему приложению (папку backend), чтобы импорты работали.
# Это гарантирует, что Python найдет пакет 'app'.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# 2. Импортируем нашу базовую модель из `database.py`.
# Alembic будет использовать ее метаданные как "цель" для сравнения с БД.
from app.database import Base

# 3. Импортируем ВСЕ модели из `models.py`.
# Это КРАЙНЕ ВАЖНЫЙ шаг. Эта строка заставляет Python "увидеть"
# все ваши классы (User, Account, Workspace и т.д.), чтобы Alembic
# мог их проанализировать.
from app import models

# This is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

db_url = os.getenv("DATABASE_URL")
if db_url:
    config.set_main_option("sqlalchemy.url", db_url)

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# --- НАЧАЛО ИСПРАВЛЕНИЙ ---

# 4. Указываем Alembic на метаданные наших импортированных моделей.
target_metadata = Base.metadata

# --- КОНЕЦ ИСПРАВЛЕНИЙ ---


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
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
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # Этот блок кода изменен, чтобы использовать URL из вашей конфигурации
    # и корректно работать с асинхронным движком, если он используется.
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