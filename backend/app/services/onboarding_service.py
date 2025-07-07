# backend/app/services/onboarding_service.py

import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from datetime import date

from app import crud, models, schemas
from app.config import settings

class OnboardingService:
    """
    Сервис, инкапсулирующий всю логику по созданию начальных данных
    для нового пользователя (onboarding).
    """

    def onboard_user(self, db: Session, *, user: models.User) -> models.Workspace:
        print(f"--- DEBUG (Onboarding): Starting onboarding for user {user.username} ---")

        workspace = self._create_default_workspace(db, user=user)

        self._create_default_accounts(db, user=user, workspace=workspace)
        self._create_default_dds_articles(db, user=user, workspace=workspace)

        # Вызываем исправленный метод
        self._create_default_transactions(db, user=user, workspace=workspace)
        
        self._create_default_mapping_rules(db, user=user, workspace=workspace)

        print(f"--- DEBUG (Onboarding): Onboarding completed for user {user.username}. ---")
        return workspace

    def _create_default_workspace(self, db: Session, *, user: models.User) -> models.Workspace:
        """Создает личное рабочее пространство и делает его активным."""
        workspace_in = schemas.WorkspaceCreate(name="Личное пространство")
        workspace = crud.workspace.create_with_owner(db, obj_in=workspace_in, owner_id=user.id)
        crud.user.set_active_workspace(db, user=user, workspace=workspace)
        return workspace

    def _create_default_accounts(self, db: Session, *, user: models.User, workspace: models.Workspace) -> None:
        """Создает стартовый набор счетов для пользователя."""
        print(f"--- DEBUG (Onboarding): Attempting to create default accounts for workspace {workspace.id}. ---")
        try:
            account_types = crud.account_type.get_multi(db)
            cash_type = next((at for at in account_types if at.code == "cash"), None)
            bank_type = next((at for at in account_types if at.code == "bank_account"), None)

            if not cash_type or not bank_type:
                print("--- ERROR: Missing default account types (cash or bank_account). Cannot create default accounts. ---")
                return

            accounts_to_create = [
                {"name": "Кошелек", "account_type_id": cash_type.id, "balance": 12000.0},
                {"name": "Карта Tinkoff", "account_type_id": bank_type.id, "balance": -5000.0},
            ]

            for account_data in accounts_to_create:
                existing_account = crud.account.get_by_name_and_workspace(
                    db, name=account_data['name'], workspace_id=workspace.id
                )
                if existing_account:
                    print(f"--- DEBUG (Onboarding): Account '{account_data['name']}' already exists for workspace {workspace.id}. Skipping creation. ---")
                    continue
                account_schema = schemas.AccountCreate(**account_data, workspace_id=workspace.id)
                crud.account.create_with_owner(db, obj_in=account_schema, owner_id=user.id)
                print(f"--- DEBUG (Onboarding): Created account '{account_schema.name}' for workspace {workspace.id}. ---")

            print(f"--- DEBUG (Onboarding): Finished creating default accounts for workspace {workspace.id}. ---")
        except Exception as e:
            print(f"--- ERROR: Failed to create default accounts: {e} ---")
            raise

    def _create_default_dds_articles(self, db: Session, *, user: models.User, workspace: models.Workspace) -> None:
        """Загружает и создает статьи DDS по умолчанию."""
        try:
            with open(settings.DEFAULT_DDS_ARTICLES_PATH, 'r', encoding='utf-8') as f:
                default_articles = json.load(f)

            def _create_articles_recursively(articles: List[Dict[str, Any]], parent_id: Optional[int] = None) -> None:
                for article_data in articles:
                    children = article_data.pop("children", [])
                    existing_article = crud.dds_article.get_by_name_and_workspace(
                        db, name=article_data['name'], workspace_id=workspace.id
                    )
                    db_article = None
                    if existing_article:
                        db_article = existing_article
                        print(f"--- DEBUG (Onboarding): DDS article '{article_data['name']}' already exists for workspace {workspace.id}. Skipping creation. ---")
                    else:
                        article_schema = schemas.DdsArticleCreate(**article_data, parent_id=parent_id, workspace_id=workspace.id)
                        db_article = crud.dds_article.create_with_owner(db, obj_in=article_schema, owner_id=user.id, workspace_id=workspace.id)
                        print(f"--- DEBUG (Onboarding): Created DDS article '{db_article.name}' for workspace {workspace.id}. ---")

                    if children and db_article:
                        _create_articles_recursively(children, parent_id=db_article.id)

            _create_articles_recursively(default_articles)
        except FileNotFoundError:
            print(f"--- WARNING: Default DDS articles file not found at {settings.DEFAULT_DDS_ARTICLES_PATH}. Skipping. ---")
        except Exception as e:
            print(f"--- ERROR: Failed to load default DDS articles: {e} ---")
            raise

    def _create_default_transactions(self, db: Session, *, user: models.User, workspace: models.Workspace) -> None:
        """Загружает и создает транзакции по умолчанию (ФИНАЛЬНАЯ ВЕРСИЯ)."""
        try:
            with open(settings.DEFAULT_TRANSACTIONS_PATH, 'r', encoding='utf-8') as f:
                default_transactions = json.load(f)

            for tx_data in default_transactions:
                # 1. Находим связанные сущности
                account = crud.account.get_by_name_and_workspace(db, name=tx_data["account_name"], workspace_id=workspace.id)
                dds_article = crud.dds_article.get_by_name_and_workspace(db, name=tx_data["dds_article_name"], workspace_id=workspace.id)

                if not account or not dds_article:
                    print(f"--- WARNING: Skipping transaction '{tx_data.get('description')}': related account or DDS article not found. ---")
                    continue

                # 2. Формируем словарь с данными для Pydantic-схемы
                schema_data = {
                    "amount": tx_data["amount"],
                    "transaction_date": date.fromisoformat(tx_data["date"]),
                    "transaction_type": models.TransactionType(tx_data["type"]),
                    "dds_article_id": dds_article.id,
                    "user_id": user.id,
                    "workspace_id": workspace.id
                }

                # 3. Добавляем полное описание
                description = tx_data.get("description", "")
                if tx_data.get("contractor"):
                    description += f" (Контрагент: {tx_data['contractor']})"
                if tx_data.get("employee"):
                    description += f" (Сотрудник: {tx_data['employee']})"
                schema_data["description"] = description
                
                # 4. Правильно устанавливаем from/to account ID
                # И добавляем account_id для валидации схемы, если она его требует
                if schema_data["transaction_type"] == models.TransactionType.INCOME:
                    schema_data["to_account_id"] = account.id
                    schema_data["account_id"] = account.id # Для схемы
                elif schema_data["transaction_type"] == models.TransactionType.EXPENSE:
                    schema_data["from_account_id"] = account.id
                    schema_data["account_id"] = account.id # Для схемы

                # 5. Проверяем на дубликат ПЕРЕД созданием схемы
                existing_transaction = db.query(models.Transaction).filter(
                    models.Transaction.description == schema_data["description"],
                    models.Transaction.amount == schema_data["amount"],
                    models.Transaction.transaction_date == schema_data["transaction_date"],
                    models.Transaction.workspace_id == workspace.id
                ).first()

                if existing_transaction:
                    print(f"--- DEBUG (Onboarding): Default transaction '{schema_data['description']}' already exists. Skipping. ---")
                    continue

                # 6. Создаем схему и сохраняем в БД
                transaction_schema = schemas.TransactionCreate(**schema_data)
                crud.transaction.create_with_owner(db, obj_in=transaction_schema, owner_id=user.id, workspace_id=workspace.id)
                print(f"--- DEBUG (Onboarding): Created default transaction '{transaction_schema.description}' for workspace {workspace.id}. ---")

        except FileNotFoundError:
            print(f"--- WARNING: Default transactions file not found at {settings.DEFAULT_TRANSACTIONS_PATH}. Skipping. ---")
        except Exception as e:
            print(f"--- ERROR: Failed to load default transactions: {e} ---")
            raise

    def _create_default_mapping_rules(self, db: Session, *, user: models.User, workspace: models.Workspace) -> None:
        """Загружает и создает правила сопоставления по умолчанию."""
        try:
            # Логика этого метода выглядит корректной, оставляем как есть
            with open(settings.DEFAULT_MAPPING_RULES_PATH, 'r', encoding='utf-8') as f:
                default_rules = json.load(f)

            for rule_data in default_rules:
                dds_article_name = rule_data.pop("dds_article_name", None)
                dds_article_id = None
                if dds_article_name:
                    dds_article = crud.dds_article.get_by_name_and_workspace(db, name=dds_article_name, workspace_id=workspace.id)
                    if dds_article:
                        dds_article_id = dds_article.id
                    else:
                        print(f"--- WARNING: Skipping rule for '{rule_data.get('keyword')}': DDS article '{dds_article_name}' not found. ---")
                        continue

                existing_rule = crud.mapping_rule.get_by_keyword_and_workspace(db, keyword=rule_data['keyword'], workspace_id=workspace.id)
                if existing_rule:
                    print(f"--- DEBUG (Onboarding): Mapping rule for '{rule_data['keyword']}' already exists. Skipping. ---")
                    continue

                rule_schema = schemas.MappingRuleCreate(**rule_data, dds_article_id=dds_article_id, workspace_id=workspace.id)
                crud.mapping_rule.create_with_owner(db, obj_in=rule_schema, owner_id=user.id, workspace_id=workspace.id)
                print(f"--- DEBUG (Onboarding): Created mapping rule for '{rule_schema.keyword}'. ---")
        except FileNotFoundError:
            print(f"--- WARNING: Default mapping rules file not found at {settings.DEFAULT_MAPPING_RULES_PATH}. Skipping. ---")
        except Exception as e:
            print(f"--- ERROR: Failed to load default mapping rules: {e} ---")
            raise

# Создаем единственный экземпляр сервиса для удобного импорта
onboarding_service = OnboardingService()