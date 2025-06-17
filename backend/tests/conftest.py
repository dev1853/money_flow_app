# backend/tests/conftest.py

import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base
from app.dependencies import get_db

# --- Настройка тестовой базы данных ---
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"  # Используем базу данных в памяти

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Создаем таблицы в тестовой БД
Base.metadata.create_all(bind=engine)

@pytest.fixture(scope="function")
def db() -> Generator:
    """
    Фикстура для создания сессии с тестовой базой данных для каждого теста.
    """
    connection = engine.connect()
    # Начинаем транзакцию
    transaction = connection.begin()
    db = TestingSessionLocal(bind=connection)

    yield db

    # Откатываем все изменения после завершения теста
    db.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db) -> Generator:
    """
    Фикстура для создания тестового клиента API.
    Переопределяет зависимость get_db на использование тестовой БД.
    """

    def override_get_db():
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c