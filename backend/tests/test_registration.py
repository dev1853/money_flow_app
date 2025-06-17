# backend/tests/test_registration.py

from fastapi.testclient import TestClient
from .utils import get_auth_token

def test_full_user_registration_flow(client: TestClient):
    """
    Проверяет полный цикл регистрации нового пользователя и создания
    для него стандартных сущностей (воркспейс, счета, транзакции).
    """
    # 1. РЕГИСТРАЦИЯ: Отправляем запрос на создание нового пользователя
    registration_payload = {
        "email": "new.test.user@example.com",
        "username": "newtestuser",
        "password": "strongpassword123",
        "full_name": "New Test User",
    }
    response = client.post("/api/users/", json=registration_payload)
    
    # Проверяем, что пользователь успешно создан
    assert response.status_code == 200, f"Ошибка при создании пользователя: {response.json()}"
    new_user = response.json()
    assert new_user["email"] == registration_payload["email"]
    print(f"✅ Пользователь '{new_user['username']}' успешно создан.")

    # 2. АУТЕНТИФИКАЦИЯ: Входим в систему от имени нового пользователя
    token = get_auth_token(client, registration_payload["email"], registration_payload["password"])
    headers = {"Authorization": f"Bearer {token}"}
    print(f"✅ Получен токен для нового пользователя.")

    # 3. ПРОВЕРКА ВОРКСПЕЙСА: Убеждаемся, что создано одно рабочее пространство
    response = client.get("/api/workspaces/", headers=headers)
    assert response.status_code == 200
    workspaces = response.json()
    assert len(workspaces) == 1, "Должен был создаться один воркспейс по умолчанию"
    workspace = workspaces[0]
    assert "My Workspace" in workspace["name"]
    print(f"✅ Создан воркспейс по умолчанию: '{workspace['name']}'")

    # 4. ПРОВЕРКА СЧЕТОВ: Убеждаемся, что созданы два счета
    workspace_id = workspace["id"]
    response = client.get(f"/api/accounts/?workspace_id={workspace_id}", headers=headers)
    assert response.status_code == 200
    accounts = response.json()
    assert len(accounts) == 2, "Должно было создаться два счета по умолчанию"
    account_names = {acc["name"] for acc in accounts}
    assert "Наличные" in account_names
    assert "Банковская карта" in account_names
    print(f"✅ Созданы счета по умолчанию: {account_names}")

    # 5. ПРОВЕРКА ТРАНЗАКЦИЙ: Убеждаемся, что для счета "Наличные" есть транзакции
    cash_account = next(acc for acc in accounts if acc["name"] == "Наличные")
    account_id = cash_account["id"]
    response = client.get(f"/api/transactions/?account_id={account_id}", headers=headers)
    assert response.status_code == 200
    transactions = response.json()
    assert len(transactions) > 0, "Должны были создаться транзакции по умолчанию"
    print(f"✅ Обнаружено {len(transactions)} транзакций для счета 'Наличные'.")