# backend/app/database.py

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Получаем URL для подключения к базе данных из переменной окружения.
# Эту переменную мы задаем в docker-compose.yml.
DATABASE_URL = os.environ.get("DATABASE_URL")

# 2. Проверяем, что переменная окружения действительно установлена.
if DATABASE_URL is None:
    raise Exception("Переменная окружения DATABASE_URL не установлена!")

# 3. Создаем "движок" SQLAlchemy с правильным URL.
engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# Зависимость для получения сессии базы данных в эндпоинтах
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()