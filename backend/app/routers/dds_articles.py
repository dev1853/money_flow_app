# /backend/app/routers/dds_articles.py

from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import crud, models, schemas
# --- ИСПРАВЛЕННЫЙ ИМПОРТ ---
from ..dependencies import (
    get_db, 
    get_current_active_user, 
    get_dds_article_for_user, # <-- ИСПОЛЬЗУЕМ ПРАВИЛЬНОЕ ИМЯ
    get_workspace_from_path   # <-- Эта зависимость нам тоже понадобится
)
# Сервисный слой здесь пока не требуется, логика проста

router = APIRouter(
    tags=["dds_articles"],
    dependencies=[Depends(get_current_active_user)],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[schemas.DdsArticle])
def read_dds_articles(
    *,
    db: Session = Depends(get_db),
    # Используем зависимость для получения воркспейса и проверки прав
    workspace: models.Workspace = Depends(get_workspace_from_path),
    skip: int = Query(0, ge=0),
    limit: int = Query(1000, ge=1),
) -> Any:
    """
    Получает иерархическое дерево статей ДДС для указанного рабочего пространства.
    """
    # Теперь, когда зависимость отработала, мы уверены, что пользователь
    # имеет доступ к этому workspace. Ручная проверка больше не нужна.
    return crud.dds_article.get_dds_articles_tree(db=db, workspace_id=workspace.id)

@router.post("/", response_model=schemas.DdsArticle, status_code=status.HTTP_201_CREATED)
def create_dds_article(
    *,
    db: Session = Depends(get_db),
    article_in: schemas.DdsArticleCreate,
    current_user: models.User = Depends(get_current_active_user)
) -> Any:
    """
    Создать новую статью ДДС.
    """
    # Проверяем права на родительский воркспейс
    workspace = crud.workspace.get(db, id=article_in.workspace_id)
    if not workspace or workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Недостаточно прав для этого рабочего пространства")

    db_article = crud.dds_article.create_with_owner(
        db=db, obj_in=article_in, owner_id=current_user.id, workspace_id=article_in.workspace_id
    )
    db.commit()
    db.refresh(db_article)
    return db_article

@router.put("/{article_id}", response_model=schemas.DdsArticle)
def update_dds_article(
    *,
    db: Session = Depends(get_db),
    article_in: schemas.DdsArticleUpdate,
    # Используем зависимость, чтобы получить статью и проверить права
    article: models.DdsArticle = Depends(get_dds_article_for_user),
) -> Any:
    """
    Обновить статью ДДС.
    """
    updated_article = crud.dds_article.update(db=db, db_obj=article, obj_in=article_in)
    db.commit()
    db.refresh(updated_article)
    return updated_article

@router.delete("/{article_id}", response_model=schemas.DdsArticle)
def delete_dds_article(
    *,
    db: Session = Depends(get_db),
    # Используем зависимость, чтобы получить статью и проверить права
    article: models.DdsArticle = Depends(get_dds_article_for_user),
) -> Any:
    """
    Удалить статью ДДС.
    """
    if article.children:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя удалить статью, у которой есть дочерние элементы. Сначала удалите их.",
        )

    deleted_article = crud.dds_article.remove(db=db, id=article.id)
    db.commit()
    return deleted_article