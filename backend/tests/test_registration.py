# backend/tests/test_registration.py

from fastapi.testclient import TestClient
from .utils import get_auth_token

def test_full_user_registration_flow(client: TestClient):
    """
    Проверяет, что при регистрации пользователя для него автоматически
    создается воркспейс и счета по умолчанию.
    """
    # 1. Регистрация нового пользователя
    registration_payload = {
        "email": "new.flow.user@example.com",
        "username": "newflowuser",
        "password": "strongpassword123",
    }
    response = client.post("/api/users/", json=registration_payload)
    assert response.status_code == 200, f"Ошибка при создании пользователя: {response.json()}"
    
    # 2. Логинимся под ним и получаем токен
    token = get_auth_token(client, registration_payload["email"], registration_payload["password"])
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Проверяем, что создался ровно один воркспейс
    response = client.get("/api/workspaces/", headers=headers)
    assert response.status_code == 200
    workspaces = response.json()
    assert len(workspaces) == 1, "Должен был создаться один воркспейс по умолчанию"
    
    # 4. Проверяем, что в этом воркспейсе создались счета по умолчанию
    workspace_id = workspaces[0]["id"]
    response = client.get(f"/api/accounts/?workspace_id={workspace_id}", headers=headers)
    assert response.status_code == 200
    accounts = response.json()
    assert len(accounts) >= 2, "Должно было создаться минимум два счета по умолчанию"