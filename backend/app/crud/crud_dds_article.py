import os
import json
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from .base import CRUDBase
from app import models, schemas

class CRUDDDSArticle(CRUDBase[models.DDSArticle, schemas.DDSArticleCreate, schemas.DDSArticleUpdate]):
    def create_default_articles(self, db: Session, *, workspace_id: int, owner_id: int):
        file_path = os.path.join(os.path.dirname(__file__), '..', '..', 'default_dds_articles.json')
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                articles = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return

        def create_recursively(articles_data: List[Dict], parent_id: Optional[int] = None):
            for article_data in articles_data:
                children = article_data.pop("children", [])
                schema = schemas.DDSArticleCreate(**article_data, parent_id=parent_id, workspace_id=workspace_id, owner_id=owner_id)
                db_article = self.create(db, obj_in=schema)
                if children:
                    create_recursively(children, db_article.id)
        
        create_recursively(articles)

dds_article = CRUDDDSArticle(models.DDSArticle)