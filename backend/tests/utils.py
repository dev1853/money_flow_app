# backend/tests/utils.py

from fastapi.testclient import TestClient
from app import schemas

def create_user(client: TestClient, email: str, password: str) -> schemas.User:
    """
    Создает пользователя через API.
    """
    username = email.split('@')[0]
    response = client.post(
        "/api/users/",
        json={"username": username, "email": email, "password": password},
    )
    assert response.status_code == 200, response.json()
    return schemas.User(**response.json())

def get_auth_token(client: TestClient, email: str, password: str) -> str:
    """
    Получает токен аутентификации для пользователя.
    """
    response = client.post(
        "/api/auth/token",
        data={"username": email, "password": password},
    )
    assert response.status_code == 200, response.json()
    token_data = response.json()
    return token_data["access_token"]