from __future__ import annotations
import os
import json
from sqlalchemy.orm import Session
from typing import List

from .. import models

# --- Загрузка правил сопоставления ключевых слов для статей ДДС ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Путь теперь относительный от директории crud/, поэтому нужно подняться на уровень выше в app/
RULES_FILE_PATH = os.path.join(BASE_DIR, '..', '..', 'dds_keyword_mapping_rules.json')
DDS_KEYWORD_RULES = []
try:
    with open(RULES_FILE_PATH, 'r', encoding='utf-8') as f:
        DDS_KEYWORD_RULES = json.load(f)
except (FileNotFoundError, json.JSONDecodeError) as e:
    # В реальном приложении здесь лучше использовать logging
    print(f"Warning: Could not load DDS keyword mapping rules. File not found or is invalid. Error: {e}")

def get_dds_article(db: Session, article_id: int):
    return db.query(models.DDSArticle).filter_by(id=article_id).first()

def create_dds_article(db: Session, article: 'schemas.DDSArticleCreate', workspace_id: int, user_id: int):
    from .. import schemas
    db_article = models.DDSArticle(**article.dict(), workspace_id=workspace_id, owner_id=user_id)
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return db_article

def get_dds_articles_hierarchy(db: Session, workspace_id: int) -> List[models.DDSArticle]:
    articles = db.query(models.DDSArticle).filter_by(workspace_id=workspace_id).order_by(models.DDSArticle.name).all()
    article_map = {article.id: article for article in articles}
    nested_list = []
    for article in articles:
        # Убедимся, что у родительского элемента есть атрибут children
        if not hasattr(article, 'children'):
            article.children = []
            
        if article.parent_id and article.parent_id in article_map:
            parent = article_map[article.parent_id]
            if not hasattr(parent, 'children'):
                parent.children = []
            parent.children.append(article)
        elif not article.parent_id:
            nested_list.append(article)
    return nested_list

def update_dds_article(db: Session, article_id: int, article_update: 'schemas.DDSArticleUpdate'):
    from .. import schemas
    db_article = get_dds_article(db, article_id)
    if not db_article:
        return None
    update_data = article_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_article, key, value)
    db.commit()
    db.refresh(db_article)
    return db_article

def has_children_articles(db: Session, article_id: int) -> bool:
    return db.query(models.DDSArticle).filter_by(parent_id=article_id).first() is not None

def delete_dds_article(db: Session, article_id: int):
    db_article = get_dds_article(db, article_id=article_id)
    if db_article:
        db.delete(db_article)
        db.commit()
    return db_article