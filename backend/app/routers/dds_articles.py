# backend/app/routers/dds_articles.py
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

# ИЗМЕНЕНИЕ: импортируем конкретные схемы
from .. import crud, auth_utils, models
from ..schemas import DDSArticle, DDSArticleCreate, DDSArticleUpdate
from ..database import get_db

router = APIRouter(
    prefix="/api/dds_articles",
    tags=["DDS Articles"],
    dependencies=[Depends(auth_utils.get_current_active_user)]
)

# --- Весь остальной код в этом файле остается без изменений, только импорты выше ---

@router.post("", response_model=DDSArticle)
def create_dds_article(
    article: DDSArticleCreate,
    workspace_id: int = Query(..., description="ID рабочего пространства, к которому относится статья"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user)
):
    crud.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    return crud.create_dds_article(db=db, article=article, workspace_id=workspace_id, user_id=current_user.id)

@router.get("", response_model=List[DDSArticle])
def read_dds_articles(
    workspace_id: int = Query(..., description="ID рабочего пространства для фильтрации статей"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user)
):
    crud.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    return crud.get_dds_articles_hierarchy(db=db, workspace_id=workspace_id)

@router.put("/{article_id}", response_model=DDSArticle)
def update_dds_article(
    article_id: int,
    article: DDSArticleUpdate,
    workspace_id: int = Query(..., description="ID рабочего пространства, которому принадлежит статья"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user)
):
    crud.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    db_article = crud.get_dds_article(db, article_id=article_id)
    if not db_article or db_article.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Статья не найдена в данном рабочем пространстве")
    return crud.update_dds_article(db=db, article_id=article_id, article_update=article)

@router.delete("/{article_id}", response_model=DDSArticle)
def delete_dds_article(
    article_id: int,
    workspace_id: int = Query(..., description="ID рабочего пространства, которому принадлежит статья"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user)
):
    crud.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    db_article = crud.get_dds_article(db, article_id=article_id)
    if not db_article or db_article.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Статья не найдена в данном рабочем пространстве")
    if crud.has_children_articles(db, article_id=article_id):
        raise HTTPException(status_code=400, detail="Невозможно удалить статью, так как у нее есть дочерние статьи")
    return crud.delete_dds_article(db=db, article_id=article_id)