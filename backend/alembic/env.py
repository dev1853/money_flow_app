# alembic/env.py

from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# --- НОВЫЕ ИЗМЕНЕНИЯ СТАРТУЮТ ТУТ ---
import os
import sys

# 1. Добавляем путь к нашему приложению, чтобы Alembic "видел" модели
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
try:
    from app.models import Base
except ImportError:
    # Обработка ошибки, если модели не найдены
    raise ImportError("Не удалось импортировать 'Base' из app.models. Убедитесь, что структура проекта верна.")

# 2. Получаем объект конфигурации Alembic
config = context.config

# 3. САМЫЙ ГЛАВНЫЙ ФИКС:
#    Программно устанавливаем URL базы данных из переменной окружения,
#    игнорируя значение в alembic.ini.
db_url = os.environ.get("DATABASE_URL")
if db_url is None:
    raise ValueError("Alembic не может найти переменную окружения DATABASE_URL!")
config.set_main_option("sqlalchemy.url", db_url)

# 4. Устанавливаем target_metadata для автогенерации миграций
target_metadata = Base.metadata

# --- КОНЕЦ ВАЖНЫХ ИЗМЕНЕНИЙ ---


# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.
    ...
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata, # Убедись, что target_metadata здесь используется
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.
    ...
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # ДОБАВЛЯЕМ ДВЕ СТРОКИ НИЖЕ
            naming_convention=naming_convention,
            render_as_batch=True 
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()