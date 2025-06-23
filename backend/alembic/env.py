# backend/alembic/env.py

import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# --- НАЧАЛО ВАЖНЫХ ИЗМЕНЕНИЙ ---

# 1. Добавляем путь к нашему приложению, чтобы Alembic "видел" модели
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
try:
    from app.database import Base
except ImportError as e:
    raise ImportError(f"Не удалось импортировать 'Base' из app.database: {e}")

# 2. Получаем объект конфигурации Alembic
config = context.config

# 3. ГЛАВНЫЙ ФИКС №1:
#    Программно устанавливаем URL базы данных из переменной окружения.
db_url = os.environ.get("DATABASE_URL")
if db_url is None:
    raise ValueError("Alembic не может найти переменную окружения DATABASE_URL!")
config.set_main_option("sqlalchemy.url", db_url)

# 4. Устанавливаем target_metadata для автогенерации миграций
target_metadata = Base.metadata

# 5. ГЛАВНЫЙ ФИКС №2:
#    Возвращаем на место определение `naming_convention`.
naming_convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}
# --- КОНЕЦ ВАЖНЫХ ИЗМЕНЕНИЙ ---

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        naming_convention=naming_convention,
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            naming_convention=naming_convention,
            render_as_batch=True
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()