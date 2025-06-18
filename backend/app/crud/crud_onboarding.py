# backend/app/crud/crud_onboarding.py

from sqlalchemy.orm import Session
from app import models, schemas, crud

def onboard_new_user(db: Session, *, user: models.User):
    """
    Создает все сущности по умолчанию для нового пользователя.
    """
    # 1. Создаем рабочее пространство
    workspace_schema = schemas.WorkspaceCreate(name=f"Пространство {user.username}")
    db_workspace = crud.workspace.create_with_owner(db=db, obj_in=workspace_schema, owner_id=user.id)
    
    # 2. Создаем статьи ДДС
    crud.dds_article.create_default_articles(db=db, workspace_id=db_workspace.id, owner_id=user.id)
    
    # 3. Создаем счета и получаем их для следующего шага
    default_accounts = crud.account.create_default_accounts(db=db, workspace_id=db_workspace.id, owner_id=user.id)

    # 4. Создаем транзакции, если были созданы счета
    if default_accounts:
        accounts_map = {acc.name: acc.id for acc in default_accounts}
        crud.transaction.create_default_transactions(db=db, workspace_id=db_workspace.id, user_id=user.id, accounts_map=accounts_map)
    
    # 5. Пересчитываем балансы после создания транзакций
    for acc in default_accounts:
        crud.account.recalculate_balance(db, account_id=acc.id)