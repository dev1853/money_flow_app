# backend/tests/test_transactions.py

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from .utils import create_user, get_auth_token

# --- Вспомогательная функция для этого файла ---

def setup_user_and_account(client: TestClient, db: Session):
    """Вспомогательная функция, которая создает пользователя и возвращает его данные."""
    email = "tx.user@example.com"
    password = "tx.password"
    create_user(client, email, password)
    token = get_auth_token(client, email, password)
    headers = {"Authorization": f"Bearer {token}"}

    # Получаем воркспейс и счет, созданные автоматически при регистрации
    ws_response = client.get("/api/workspaces/", headers=headers)
    assert ws_response.status_code == 200
    workspace = ws_response.json()[0]

    acc_response = client.get(f"/api/accounts/?workspace_id={workspace['id']}", headers=headers)
    assert acc_response.status_code == 200
    account = acc_response.json()[0]
    
    return headers, account

# --- Тесты ---

def test_create_transaction_updates_balance(client: TestClient, db: Session):
    headers, account = setup_user_and_account(client, db)
    account_id = account['id']
    initial_balance = account['current_balance']

    client.post("/api/transactions/", json={"date": "2025-01-01", "description": "Test Income", "amount": 500, "transaction_type": "income", "account_id": account_id}, headers=headers)
    
    response = client.get(f"/api/accounts/{account_id}", headers=headers)
    updated_account = response.json()
    assert updated_account['current_balance'] == initial_balance + 500


def test_update_transaction_recalculates_balance(client: TestClient, db: Session):
    headers, account = setup_user_and_account(client, db)
    account_id = account['id']
    initial_balance = account['current_balance']

    tx_response = client.post("/api/transactions/", json={"date": "2025-01-01", "description": "Original Tx", "amount": 500, "transaction_type": "income", "account_id": account_id}, headers=headers)
    transaction = tx_response.json()

    client.put(f"/api/transactions/{transaction['id']}", json={"amount": 200}, headers=headers)
    
    response = client.get(f"/api/accounts/{account_id}", headers=headers)
    updated_account = response.json()
    assert updated_account['current_balance'] == initial_balance + 200


def test_delete_transaction_recalculates_balance(client: TestClient, db: Session):
    headers, account = setup_user_and_account(client, db)
    account_id = account['id']
    initial_balance = account['current_balance']

    tx_response = client.post("/api/transactions/", json={"date": "2025-01-01", "description": "To be deleted", "amount": -300, "transaction_type": "expense", "account_id": account_id}, headers=headers)
    transaction = tx_response.json()

    client.delete(f"/api/transactions/{transaction['id']}", headers=headers)

    response = client.get(f"/api/accounts/{account_id}", headers=headers)
    updated_account = response.json()
    assert updated_account['current_balance'] == initial_balance


def test_cannot_update_other_user_transaction(client: TestClient, db: Session):
    user1_email = "owner.tx@example.com"
    create_user(client, user1_email, "password")
    token1 = get_auth_token(client, user1_email, "password")
    headers1 = {"Authorization": f"Bearer {token1}"}

    user2_email = "intruder.tx@example.com"
    create_user(client, user2_email, "password")
    token2 = get_auth_token(client, user2_email, "password")
    headers2 = {"Authorization": f"Bearer {token2}"}

    ws_resp1 = client.get("/api/workspaces/", headers=headers1)
    acc_resp1 = client.get(f"/api/accounts/?workspace_id={ws_resp1.json()[0]['id']}", headers=headers1)
    account1_id = acc_resp1.json()[0]['id']
    
    tx_resp1 = client.post("/api/transactions/", json={"date": "2025-01-01", "description": "Owner TX", "amount": 100, "transaction_type": "income", "account_id": account1_id}, headers=headers1)
    transaction1_id = tx_resp1.json()['id']

    response = client.put(f"/api/transactions/{transaction1_id}", json={"description": "Updated by intruder"}, headers=headers2)
    assert response.status_code == 404