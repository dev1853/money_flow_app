import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# --- Загрузка .env файла ---
# Этот блок находит и загружает ваш .env файл из папки backend/
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=dotenv_path)


# --- Настройка SQLAlchemy ---

# ИСПРАВЛЕНИЕ: Используем правильное имя переменной из .env файла
SQLALCHEMY_DATABASE_URL = os.getenv("SQLALCHEMY_DATABASE_URL")

# Проверка, что URL был успешно загружен
if not SQLALCHEMY_DATABASE_URL:
    raise ValueError(
        "Не удалось загрузить SQLALCHEMY_DATABASE_URL. "
        "Убедитесь, что файл .env существует в папке backend/ и содержит эту переменную."
    )

# Стандартные соглашения для именования ограничений в базе данных
naming_convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

metadata = MetaData(naming_convention=naming_convention)

# Создаем "движок" для подключения к базе данных
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Создаем класс для сессий (транзакций) с базой данных
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Создаем базовый класс для всех наших моделей (таблиц)
Base = declarative_base(metadata=metadata)


# Функция-зависимость для получения сессии в эндпоинтах FastAPI
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