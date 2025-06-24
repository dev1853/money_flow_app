# backend/app/crud/crud_dds_article.py

import os
import json
from pathlib import Path
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from fastapi.encoders import jsonable_encoder
from .. import models, schemas
from .base import CRUDBase

class CRUDDDSArticle(CRUDBase[models.DdsArticle, schemas.DdsArticleCreate, schemas.DdsArticleUpdate]):
    """
    CRUD-класс для работы со статьями ДДС (Движение Денежных Средств).
    """

    def get_dds_articles_tree(self, db: Session, *, workspace_id: int) -> List[schemas.DdsArticle]:
        """
        Получает все статьи ДДС для рабочего пространства и строит их в виде дерева.
        Финальная, наиболее надежная версия.
        """
        # 1. Получаем все статьи одним запросом из базы, отсортированные по ID
        all_articles_from_db = (
            db.query(self.model)
            .filter(self.model.workspace_id == workspace_id)
            .order_by(self.model.id)
            .all()
        )

        # 2. Создаем Pydantic-модели и словарь для быстрого доступа по ID.
        #    Использование словаря по уникальному ключу `id` гарантирует отсутствие дублей.
        nodes = {article.id: schemas.DdsArticle.from_orm(article) for article in all_articles_from_db}

        # 3. У каждой Pydantic-модели очищаем список дочерних элементов
        for node in nodes.values():
            node.children = []

        # 4. Строим дерево: добавляем каждый узел в список children его родителя
        root_nodes = []
        for node_id, node in nodes.items():
            if node.parent_id and node.parent_id in nodes:
                # Находим родителя в нашем словаре и добавляем текущий узел ему в дети
                nodes[node.parent_id].children.append(node)
            else:
                # Если родителя нет, это узел верхнего уровня
                root_nodes.append(node)
        
        return root_nodes
    
    def get_multi_by_workspace(
        self, db: Session, *, workspace_id: int, skip: int = 0, limit: int = 1000
    ) -> List[models.DdsArticle]:
        """
        Получает плоский список статей для указанного рабочего пространства.
        """
        return (
            db.query(self.model)
            .filter(models.DdsArticle.workspace_id == workspace_id)
            .order_by(self.model.id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create_with_owner(
        self, db: Session, *, obj_in: schemas.DdsArticleCreate, owner_id: int
    ) -> models.DdsArticle:
        """
        Создает статью ДДС с указанием владельца.

        :param db: Сессия базы данных SQLAlchemy.
        :param obj_in: Данные для создания статьи (Pydantic-схема).
        :param owner_id: Идентификатор владельца.
        :return: Созданный ORM-объект статьи.
        """
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = self.model(**obj_in_data, owner_id=owner_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def create_default_articles(self, db: Session, *, workspace_id: int, owner_id: int):
        """
        Создает иерархию статей ДДС по умолчанию из JSON-файла.

        :param db: Сессия базы данных SQLAlchemy.
        :param workspace_id: Идентификатор рабочего пространства.
        :param owner_id: Идентификатор владельца.
        """
        print("--- Запущена функция create_default_articles ---")  # ОТЛАДКА

        json_path = Path(__file__).parent.parent / "default_dds_articles.json"

        if not json_path.exists():
            print(f"!!! ОШИБКА: Файл {json_path} не найден!")  # ОТЛАДКА
            return

        with open(json_path, "r", encoding="utf-8") as f:
            default_articles_tree = json.load(f)

        if not default_articles_tree:
            print("--- ПРЕДУПРЕЖДЕНИЕ: JSON-файл пуст. Статьи не будут созданы. ---")  # ОТЛАДКА
            return

        print(f"--- Загружено {len(default_articles_tree)} корневых статей из JSON. ---")  # ОТЛАДКА

        def _create_article_tree(articles_list, parent_id=None):
            """
            Рекурсивно создает статьи и их дочерние элементы.
            """
            for article_data in articles_list:
                print(f"--- Создаю статью: {article_data.get('name')} ---")  # ОТЛАДКА
                children = article_data.pop("children", [])

                article_schema = schemas.DdsArticleCreate(
                    **article_data,
                    parent_id=parent_id,
                    workspace_id=workspace_id,
                    owner_id=owner_id
                )

                db_article = self.create(db=db, obj_in=article_schema)

                if children:
                    _create_article_tree(children, parent_id=db_article.id)

        _create_article_tree(default_articles_tree)
        print("--- Завершение функции create_default_articles ---")  # ОТЛАДКА
        # db.commit() # Этот коммит мы убрали, так как онбординг делает общий коммит в конце

# Экземпляр CRUD-класса для статей ДДС
dds_article = CRUDDDSArticle(models.DdsArticle)

# Загрузка правил сопоставления ключевых слов для статей ДДС
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RULES_FILE_PATH = os.path.join(BASE_DIR, '..', '..', 'dds_keyword_mapping_rules.json')
DDS_KEYWORD_RULES = []
try:
    with open(RULES_FILE_PATH, 'r', encoding='utf-8') as f:
        DDS_KEYWORD_RULES = json.load(f)
except (FileNotFoundError, json.JSONDecodeError) as e:
    print(f"Warning: Could not load DDS keyword mapping rules. File not found or is invalid. Error: {e}")
