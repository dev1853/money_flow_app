# /backend/app/crud/crud_onboarding.py

from sqlalchemy.orm import Session
import json

from .. import crud, models, schemas

DEFAULT_DDS_ARTICLES_PATH = 'app/default_dds_articles.json'
DEFAULT_TRANSACTIONS_PATH = 'app/default_transactions.json'

def onboard_new_user(db: Session, *, user: models.User):
    """
    Полный процесс онбординга нового пользователя:
    1. Создает "Личное" рабочее пространство.
    2. Создает дефолтные счета.
    3. Загружает дефолтные статьи ДДС.
    4. Загружает дефолтные транзакции.
    """
    print(f"--- DEBUG (Onboarding): Starting onboarding for user {user.username} ---")

    # 1. Создание рабочего пространства
    workspace_in = schemas.WorkspaceCreate(
        name="Личное пространство"
        # --- ИСПРАВЛЕНИЕ ---
        # Поле 'description' было удалено, так как его нет в модели Workspace
    )
    workspace = crud.workspace.create_with_owner(db, obj_in=workspace_in, owner_id=user.id)
    crud.user.set_active_workspace(db, user=user, workspace=workspace)

    # 2. Создание счетов
    accounts_to_create = [
    # ИСПРАВЛЕНИЕ: Добавляем 'account_type'
    schemas.AccountCreate(
        name="Наличные", 
        balance=1000, 
        workspace_id=workspace.id, 
        account_type="cash" # <-- ДОБАВЛЕНО
    ),
    # ИСПРАВЛЕНИЕ: Добавляем 'account_type'
    schemas.AccountCreate(
        name="Карта", 
        balance=5000, 
        workspace_id=workspace.id, 
        account_type="bank" # <-- ДОБАВЛЕНО
    ),
    ]
    for acc_in in accounts_to_create:
        crud.account.create_with_owner(
            db, obj_in=acc_in, owner_id=user.id
        )
    # 3. Загрузка статей ДДС
    try:
        with open(DEFAULT_DDS_ARTICLES_PATH, 'r', encoding='utf-8') as f:
            default_articles = json.load(f)

        created_articles = {}
        def create_articles_recursively(articles, parent_id=None):
            for article_data in articles:
                children = article_data.pop("children", [])
                
                article_schema = schemas.DdsArticleCreate(
                    **article_data, 
                    parent_id=parent_id, 
                    workspace_id=workspace.id
                )
                
                db_article = crud.dds_article.create_with_owner(
                    db, 
                    obj_in=article_schema,
                    owner_id=user.id,
                    workspace_id=workspace.id
                )
                created_articles[article_data['name']] = db_article.id
                if children:
                    create_articles_recursively(children, parent_id=db_article.id)

        create_articles_recursively(default_articles)
    except FileNotFoundError:
        print(f"--- WARNING: Default DDS articles file not found at {DEFAULT_DDS_ARTICLES_PATH}. Skipping. ---")
    except Exception as e:
        print(f"--- ERROR: Failed to load default DDS articles: {e} ---")

    # 4. Загрузка транзакций (опционально)
    try:
        # Логика для загрузки дефолтных транзакций может быть добавлена здесь
        pass
    except Exception as e:
        print(f"--- ERROR: Failed to load default transactions: {e} ---")