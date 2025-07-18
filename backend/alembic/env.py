import os
import sys
from logging.config import fileConfig
from dotenv import load_dotenv
from sqlalchemy import engine_from_config, pool
from alembic import context

# --- ШАГ 1: Гибкая загрузка переменных окружения ---
def find_and_load_env():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    for fname in ['.env', 'env.development', 'env.production']:
        env_path = os.path.join(base_dir, fname)
        if os.path.exists(env_path):
            load_dotenv(dotenv_path=env_path, override=True)
            print(f"Загружен env-файл: {env_path}")
            return
    print(f"ПРЕДУПРЕЖДЕНИЕ: .env/.env.development/.env.production не найдены в {base_dir}")

find_and_load_env()

# --- ШАГ 2: Добавляем путь к backend для импорта моделей ---
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# --- ШАГ 3: Настраиваем Alembic ---
config = context.config

# --- ШАГ 4: Получаем URL базы данных ---
sqlalchemy_url = os.getenv("SQLALCHEMY_DATABASE_URL") or os.getenv("DATABASE_URL")
if sqlalchemy_url:
    config.set_main_option("sqlalchemy.url", sqlalchemy_url)
else:
    raise ValueError("Не удалось найти SQLALCHEMY_DATABASE_URL или DATABASE_URL в env-файле!")

# --- Логирование ---
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# --- Импорт моделей для Alembic ---
from app.database import Base
from app import models

target_metadata = Base.metadata

# --- Стандартные функции Alembic ---
def run_migrations_offline() -> None:
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