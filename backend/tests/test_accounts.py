# backend/tests/test_accounts.py

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from .utils import create_user, get_auth_token

def test_get_account_by_another_user_fails(client: TestClient, db: Session):
    """
    Тест: проверяем, что пользователь НЕ может получить доступ к чужому счету.
    """
    # 1. Создаем двух пользователей
    user_1 = create_user(client, "user1@example.com", "password123")
    user_2 = create_user(client, "user2@example.com", "password123")

    # 2. Получаем их токены
    token_1 = get_auth_token(client, "user1@example.com", "password123")
    token_2 = get_auth_token(client, "user2@example.com", "password123")

    headers_1 = {"Authorization": f"Bearer {token_1}"}
    headers_2 = {"Authorization": f"Bearer {token_2}"}

    # 3. Пользователь 1 создает рабочее пространство
    response = client.post("/api/v1/workspaces/", json={"name": "Workspace 1"}, headers=headers_1)
    assert response.status_code == 200
    workspace_1 = response.json()

    # 4. Пользователь 1 создает счет в своем рабочем пространстве
    response = client.post(
        "/api/v1/accounts/",
        json={
            "name": "My Bank Account",
            "currency": "USD",
            "current_balance": 1000,
            "workspace_id": workspace_1["id"],
        },
        headers=headers_1,
    )
    assert response.status_code == 200
    account_1 = response.json()

    # 5. Пользователь 2 пытается получить доступ к счету пользователя 1
    response = client.get(f"/api/v1/accounts/{account_1['id']}", headers=headers_2)

    # 6. Проверяем, что доступ запрещен
    # С текущим кодом этот тест УПАДЕТ, потому что вернется статус 200.
    # Мы ожидаем 403 (Forbidden) или 404 (Not Found).
    assert response.status_code == 403 or response.status_code == 404