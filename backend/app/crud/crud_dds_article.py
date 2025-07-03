# backend/app/crud/crud_dds_article.py

import os
import json
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Dict, Any, Optional
from fastapi.encoders import jsonable_encoder
from .base import CRUDBase
from .. import models, schemas # Убедитесь, что models и schemas импортированы

class CRUDDdsArticle(CRUDBase[models.DdsArticle, schemas.DdsArticleCreate, schemas.DdsArticleUpdate]):
    """
    CRUD-класс для работы со статьями ДДС (Движение Денежных Средств).
    """

    # НОВЫЙ МЕТОД: get_by_name_and_workspace
    def get_by_name_and_workspace(
        self, db: Session, *, name: str, workspace_id: int
    ) -> Optional[models.DdsArticle]:
        """
        Получает статью ДДС по имени и ID рабочего пространства.
        """
        return (
            db.query(self.model)
            .filter(self.model.name == name, self.model.workspace_id == workspace_id)
            .first()
        )

    def get_dds_articles_tree(self, db: Session, *, workspace_id: int) -> List[schemas.DdsArticle]:
        """
        Получает все статьи ДДС для рабочего пространства и строит их в виде дерева.
        """
        all_articles_from_db = (
            db.query(self.model)
            .filter(self.model.workspace_id == workspace_id)
            .order_by(self.model.id)
            .all()
        )
        nodes = {article.id: schemas.DdsArticle.from_orm(article) for article in all_articles_from_db}
        for node in nodes.values():
            node.children = []
        root_nodes = []
        for node_id, node in nodes.items():
            if node.parent_id and node.parent_id in nodes:
                nodes[node.parent_id].children.append(node)
            else:
                root_nodes.append(node)
        return root_nodes
    
    def get_multi_by_workspace(
        self, db: Session, *, workspace_id: int, skip: int = 0, limit: int = 1000
    ) -> List[models.DdsArticle]:
        return (
            db.query(self.model)
            .filter(models.DdsArticle.workspace_id == workspace_id)
            .order_by(self.model.id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create_with_owner(
        self, db: Session, *, obj_in: schemas.DdsArticleCreate, owner_id: int, workspace_id: int
    ) -> models.DdsArticle:
        obj_in_data = obj_in.model_dump()
        db_obj = self.model(**obj_in_data)
        
        # created_at/updated_at теперь только из server_default в models.py
        
        db_obj.owner_id = owner_id
        db_obj.workspace_id = workspace_id
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def create_default_articles(self, db: Session, *, articles_data: List[Dict[str, Any]], workspace_id: int, owner_id: int): 
        """
        Создает иерархию статей ДДС по умолчанию из JSON-файла.
        """
        print("--- Запущена функция create_default_articles ---")

        if not articles_data:
            print("--- ПРЕДУПРЕЖДЕНИЕ: Нет данных для создания статей ДДС. ---")
            return

        print(f"--- Загружено {len(articles_data)} корневых статей для обработки. ---")

        def _create_article_tree(articles_list, parent_id=None):
            for article_data_item in articles_list:
                print(f"--- Создаю статью: {article_data_item.get('name')} ---")
                children = article_data_item.pop("children", [])

                article_schema = schemas.DdsArticleCreate(
                    **article_data_item, 
                    parent_id=parent_id
                )

                db_article = self.create_with_owner(db=db, obj_in=article_schema, owner_id=owner_id, workspace_id=workspace_id)

                if children:
                    _create_article_tree(children, parent_id=db_article.id)

        _create_article_tree(articles_data) 
        print("--- Завершение функции create_default_articles ---")

dds_article = CRUDDdsArticle(models.DdsArticle)

# Загрузка правил сопоставления ключевых слов для статей ДДС (этот блок должен быть в crud_onboarding.py)
# BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# RULES_FILE_PATH = os.path.join(BASE_DIR, '..', '..', 'dds_keyword_mapping_rules.json')
# DDS_KEYWORD_RULES = []
# try:
#     with open(RULES_FILE_PATH, 'r', encoding='utf-8') as f:
#         DDS_KEYWORD_RULES = json.load(f)
# except (FileNotFoundError, json.JSONDecodeError) as e:
#     print(f"Warning: Could not load DDS keyword mapping rules. File not found or is invalid. Error: {e}")