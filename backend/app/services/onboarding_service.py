# /backend/app/services/onboarding_service.py

import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.config import settings

class OnboardingService:
    """
    Сервис, инкапсулирующий всю логику по созданию начальных данных
    для нового пользователя (onboarding).
    """

    def onboard_user(self, db: Session, *, user: models.User) -> None:
        """
        Главный метод, который оркестрирует полный процесс онбординга.
        """
        print(f"--- DEBUG (Onboarding): Starting onboarding for user {user.username} ---")
        
        workspace = self._create_default_workspace(db, user=user)
        
        self._create_default_accounts(db, user=user, workspace=workspace)
        
        self._create_default_dds_articles(db, user=user, workspace=workspace)

    def _create_default_workspace(self, db: Session, *, user: models.User) -> models.Workspace:
        """Создает личное рабочее пространство и делает его активным."""
        workspace_in = schemas.WorkspaceCreate(name="Личное пространство")
        workspace = crud.workspace.create_with_owner(db, obj_in=workspace_in, owner_id=user.id)
        crud.user.set_active_workspace(db, user=user, workspace=workspace)
        return workspace

    def _create_default_accounts(self, db: Session, *, user: models.User, workspace: models.Workspace) -> None:
        """Создает стартовый набор счетов (Наличные, Карта)."""
        # ИСПРАВЛЕНИЕ: Весь этот блок теперь находится внутри одного метода
        accounts_to_create = [
            schemas.AccountCreate(name="Наличные", balance=1000, workspace_id=workspace.id, account_type="cash_box"),
            schemas.AccountCreate(name="Карта", balance=5000, workspace_id=workspace.id, account_type="bank_account"),
        ]
        for acc_in in accounts_to_create:
            crud.account.create_with_owner(db, obj_in=acc_in, owner_id=user.id)

    def _create_default_dds_articles(self, db: Session, *, user: models.User, workspace: models.Workspace) -> None:
        """Загружает иерархию статей ДДС из JSON-файла."""
        try:
            with open(settings.DEFAULT_DDS_ARTICLES_PATH, 'r', encoding='utf-8') as f:
                default_articles = json.load(f)
            
            # Внутренняя рекурсивная функция для создания дерева статей
            def _create_articles_recursively(articles: List[Dict[str, Any]], parent_id: int = None) -> None:
                for article_data in articles:
                    children = article_data.pop("children", [])
                    
                    # Готовим схему со всеми данными
                    article_schema = schemas.DdsArticleCreate(
                        **article_data,
                        parent_id=parent_id,
                        workspace_id=workspace.id # workspace_id уже здесь
                    )
                    
                    # ИСПРАВЛЕНИЕ: Передаем все необходимые аргументы в CRUD-функцию.
                    # Теперь и owner_id, и workspace_id передаются явно.
                    db_article = crud.dds_article.create_with_owner(
                        db,
                        obj_in=article_schema,
                        owner_id=user.id,
                        workspace_id=workspace.id # <-- ДОБАВЛЕН НЕДОСТАЮЩИЙ АРГУМЕНТ
                    )
                    
                    if children:
                        _create_articles_recursively(children, parent_id=db_article.id)

            _create_articles_recursively(default_articles)

        except FileNotFoundError:
            # Для продакшена здесь лучше использовать logging.warning
            print(f"--- WARNING: Default DDS articles file not found at {settings.DEFAULT_DDS_ARTICLES_PATH}. Skipping. ---")
        except Exception as e:
            # Для продакшена здесь лучше использовать logging.error
            print(f"--- ERROR: Failed to load default DDS articles: {e} ---")

# Создаем единственный экземпляр сервиса для удобного импорта
onboarding_service = OnboardingService()