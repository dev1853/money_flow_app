import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# --- Гибкая загрузка .env файла ---
def find_and_load_env():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    for fname in ['.env', 'env.development', 'env.production']:
        env_path = os.path.join(base_dir, fname)
        if os.path.exists(env_path):
            load_dotenv(dotenv_path=env_path, override=True)
            break
find_and_load_env()

# --- Настройка SQLAlchemy ---
# Поддержка обоих вариантов переменной
SQLALCHEMY_DATABASE_URL = os.getenv("SQLALCHEMY_DATABASE_URL") or os.getenv("DATABASE_URL")
if not SQLALCHEMY_DATABASE_URL:
    raise ValueError(
        "Не удалось загрузить SQLALCHEMY_DATABASE_URL или DATABASE_URL. "
        "Убедитесь, что .env/.env.development/.env.production содержит эту переменную."
    )

naming_convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}
metadata = MetaData(naming_convention=naming_convention)
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base(metadata=metadata)

def get_db():
    """
    Зависимость FastAPI для управления сессиями базы данных.
    Гарантированно открывает и закрывает сессию для каждого запроса.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()