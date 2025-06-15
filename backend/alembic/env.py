# alembic/env.py

from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# --- НОВЫЕ ИЗМЕНЕНИЯ СТАРТУЮТ ТУТ ---
import os
import sys

naming_convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

# Определяем абсолютный путь к директории 'backend' (на один уровень выше 'alembic')
# и добавляем его в sys.path, чтобы Python мог найти 'app'
current_dir = os.path.dirname(__file__)
project_root = os.path.abspath(os.path.join(current_dir, '..'))
sys.path.insert(0, project_root) # Используем insert(0) для приоритета

# Теперь импортируем Base и models, зная, что 'app' в sys.path
# Убедись, что 'app.database' и 'app.models' это правильные пути к твоим файлам.
try:
    from app.database import Base
    from app import models # Импортируем, чтобы все модели были известны Base.metadata
except ImportError as e:
    print(f"Ошибка импорта Base или models: {e}")
    print(f"Текущий sys.path: {sys.path}")
    raise

target_metadata = Base.metadata # ЭТА СТРОКА ОЧЕНЬ ВАЖНА!
# --- НОВЫЕ ИЗМЕНЕНИЯ ЗАКАНЧИВАЮТСЯ ТУТ ---


# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.

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