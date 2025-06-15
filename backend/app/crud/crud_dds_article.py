# backend/app/crud_dds_article.py

from __future__ import annotations
import os
import json
from sqlalchemy.orm import Session
from typing import List, Dict, Optional

from .. import models, schemas # Схемы импортируются здесь

# --- Загрузка правил сопоставления ключевых слов для статей ДДС ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Путь теперь относительный от директории crud/, поэтому нужно подняться на уровень выше в app/
RULES_FILE_PATH = os.path.join(BASE_DIR, '..', '..', 'dds_keyword_mapping_rules.json')
DDS_KEYWORD_RULES = []
try:
    with open(RULES_FILE_PATH, 'r', encoding='utf-8') as f:
        DDS_KEYWORD_RULES = json.load(f)
except (FileNotFoundError, json.JSONDecodeError) as e:
    print(f"Warning: Could not load DDS keyword mapping rules. File not found or is invalid. Error: {e}")

def get_dds_article(db: Session, article_id: int):
    return db.query(models.DDSArticle).filter_by(id=article_id).first()

def create_dds_article(db: Session, article: schemas.DDSArticleCreate, workspace_id: int, user_id: int):
    db_article = models.DDSArticle(
        **article.model_dump(), # Используем .model_dump()
        # **article.dict(), # Для Pydantic v1
        workspace_id=workspace_id,
        owner_id=user_id
    )
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return db_article

def get_dds_articles_hierarchy(db: Session, workspace_id: int) -> List[models.DDSArticle]:
    articles = db.query(models.DDSArticle).filter_by(workspace_id=workspace_id).order_by(models.DDSArticle.name).all()
    
    article_map = {article.id: article for article in articles}
    
    for article in articles:
        article.children = []

    root_articles = []
    
    for article in articles:
        if article.parent_id and article.parent_id in article_map:
            parent = article_map[article.parent_id]
            parent.children.append(article)
        else:
            root_articles.append(article)
            
    return root_articles

def update_dds_article(db: Session, article_id: int, article_update: schemas.DDSArticleUpdate):
    db_article = get_dds_article(db, article_id)
    if not db_article:
        return None
    update_data = article_update.model_dump(exclude_unset=True) # Используем .model_dump()
    # update_data = article_update.dict(exclude_unset=True) # Для Pydantic v1
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

def create_default_dds_articles(db: Session, workspace_id: int, user_id: int):
    """
    Читает JSON-файл и рекурсивно создает иерархию статей ДДС.
    """
    # Путь к файлу JSON (он лежит в папке backend/, на два уровня выше от crud/)
    file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'default_dds_articles.json')

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            default_articles = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        print(f"Warning: Could not load default DDS articles from {file_path}")
        return

    def create_articles_recursively(articles_data: List[Dict], parent_id: Optional[int] = None):
        for article_data in articles_data:
            children = article_data.pop("children", [])
            
            article_schema = schemas.DDSArticleCreate(
                name=article_data["name"],
                type=article_data["type"],
                parent_id=parent_id
            )
            
            db_article = create_dds_article(
                db=db,
                article=article_schema,
                workspace_id=workspace_id,
                user_id=user_id
            )
            
            if children:
                create_articles_recursively(children, parent_id=db_article.id)

    create_articles_recursively(default_articles)
    db.commit() # Коммит всех дефолтных статей