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
    
    # 3. Создаем счета
    crud.account.create_default_accounts(db=db, workspace_id=db_workspace.id, owner_id=user.id)

    # --- ЭТИ ШАГИ МЫ УБИРАЕМ, ЧТОБЫ НЕ СОЗДАВАТЬ ЛИШНИХ ТРАНЗАКЦИЙ ---
    # Транзакции и пересчет баланса больше не нужны при онбординге.
    # Пользователь начнет с чистого листа.
    
    # Последний шаг - устанавливаем рабочее пространство активным
    user.active_workspace_id = db_workspace.id
    db.add(user)
    db.commit()