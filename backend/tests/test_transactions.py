# backend/tests/test_transactions.py

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from .utils import create_user, get_auth_token

# --- Вспомогательная функция для этого файла ---

def setup_user_and_account(client: TestClient, db: Session):
    """Создает пользователя, рабочее пространство, счет и возвращает их данные."""
    user = create_user(client, "testuser@example.com", "password")
    token = get_auth_token(client, "testuser@example.com", "password")
    headers = {"Authorization": f"Bearer {token}"}

    # Создаем рабочее пространство
    response = client.post("/api/v1/workspaces/", json={"name": "Test Workspace"}, headers=headers)
    assert response.status_code == 200
    workspace = response.json()

    # Создаем счет с начальным балансом 1000
    response = client.post(
        "/api/v1/accounts/",
        json={"name": "Main Account", "currency": "RUB", "current_balance": 1000, "workspace_id": workspace["id"]},
        headers=headers
    )
    assert response.status_code == 200
    account = response.json()

    return headers, account

# --- Тесты ---

def test_create_transaction_updates_balance(client: TestClient, db: Session):
    """
    Тест: При создании транзакции баланс счета корректно обновляется.
    """
    headers, account = setup_user_and_account(client, db)
    account_id = account['id']

    # Создаем транзакцию "доход" на 500
    transaction_payload = {
        "date": "2025-06-17",
        "description": "Зарплата",
        "amount": 500,
        "transaction_type": "income",
        "account_id": account_id
    }
    response = client.post("/api/v1/transactions/", json=transaction_payload, headers=headers)
    assert response.status_code == 200, response.text

    # Проверяем, что баланс счета обновился
    response = client.get(f"/api/v1/accounts/{account_id}", headers=headers)
    assert response.status_code == 200
    updated_account = response.json()
    # Ожидаем 1000 (начальный) + 500 (доход) = 1500
    assert updated_account['current_balance'] == 1500


def test_update_transaction_recalculates_balance(client: TestClient, db: Session):
    """
    Тест [ОЖИДАЕТСЯ ПАДЕНИЕ]: При обновлении транзакции баланс пересчитывается.
    """
    headers, account = setup_user_and_account(client, db)
    account_id = account['id']

    # Создаем транзакцию "доход" на 500. Баланс становится 1500.
    tx_response = client.post("/api/v1/transactions/", json={"date": "2025-06-17", "description": "Зарплата", "amount": 500, "transaction_type": "income", "account_id": account_id}, headers=headers)
    assert tx_response.status_code == 200
    transaction = tx_response.json()

    # Обновляем сумму транзакции с 500 до 200
    update_payload = {"amount": 200}
    response = client.put(f"/api/v1/transactions/{transaction['id']}", json=update_payload, headers=headers)
    assert response.status_code == 200, response.text

    # Проверяем, что баланс счета ПЕРЕСЧИТАЛСЯ
    response = client.get(f"/api/v1/accounts/{account_id}", headers=headers)
    assert response.status_code == 200
    updated_account = response.json()
    # Ожидаем 1000 (начальный) + 200 (новый доход) = 1200
    assert updated_account['current_balance'] == 1200


def test_delete_transaction_recalculates_balance(client: TestClient, db: Session):
    """
    Тест [ОЖИДАЕТСЯ ПАДЕНИЕ]: При удалении транзакции баланс пересчитывается.
    """
    headers, account = setup_user_and_account(client, db)
    account_id = account['id']

    # Создаем транзакцию "расход" на 300. Баланс становится 700.
    tx_response = client.post("/api/v1/transactions/", json={"date": "2025-06-17", "description": "Покупка", "amount": -300, "transaction_type": "expense", "account_id": account_id}, headers=headers)
    assert tx_response.status_code == 200
    transaction = tx_response.json()

    # Удаляем транзакцию
    response = client.delete(f"/api/v1/transactions/{transaction['id']}", headers=headers)
    assert response.status_code == 200, response.text

    # Проверяем, что баланс счета ВЕРНУЛСЯ к исходному
    response = client.get(f"/api/v1/accounts/{account_id}", headers=headers)
    assert response.status_code == 200
    updated_account = response.json()
    # Ожидаем 1000 (начальный)
    assert updated_account['current_balance'] == 1000


def test_cannot_update_other_user_transaction(client: TestClient, db: Session):
    """
    Тест [ОЖИДАЕТСЯ ПАДЕНИЕ]: Пользователь не может обновить чужую транзакцию.
    """
    # Пользователь 1
    user1 = create_user(client, "user1@example.com", "password")
    token1 = get_auth_token(client, "user1@example.com", "password")
    headers1 = {"Authorization": f"Bearer {token1}"}
    
    # Пользователь 2
    user2 = create_user(client, "user2@example.com", "password")
    token2 = get_auth_token(client, "user2@example.com", "password")
    headers2 = {"Authorization": f"Bearer {token2}"}

    # Пользователь 1 создает рабочее пространство, счет и транзакцию
    ws_resp = client.post("/api/v1/workspaces/", json={"name": "WS1"}, headers=headers1)
    acc_resp = client.post("/api/v1/accounts/", json={"name": "Acc1", "currency": "RUB", "current_balance": 1000, "workspace_id": ws_resp.json()['id']}, headers=headers1)
    tx_resp = client.post("/api/v1/transactions/", json={"date": "2025-06-17", "description": "TX1", "amount": 100, "transaction_type": "income", "account_id": acc_resp.json()['id']}, headers=headers1)
    transaction1 = tx_resp.json()

    # Пользователь 2 пытается обновить транзакцию пользователя 1
    update_payload = {"description": "Updated by another user"}
    response = client.put(f"/api/v1/transactions/{transaction1['id']}", json=update_payload, headers=headers2)

    # Ожидаем ошибку доступа (404 Not Found или 403 Forbidden)
    assert response.status_code in [404, 403]