# backend/app/routers/dds_articles.py

from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, Query 
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_ 


from app import crud, models, schemas
from app.dependencies import get_db, get_current_active_user, get_article_for_user

router = APIRouter(
    tags=["dds_articles"],
    dependencies=[Depends(get_current_active_user)],
    responses={404: {"description": "Not found"}},
)

# --- Эндпоинт для получения дерева статей ---
@router.get("/", response_model=List[schemas.DdsArticle]) # Остается "/"
def read_dds_articles(
    *,
    db: Session = Depends(get_db),
    workspace_id: int = Query(..., description="ID рабочего пространства"),
    skip: int = 0,
    limit: int = 1000,
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Получает плоский список статей ДДС для указанного рабочего пространства.
    """
    if not crud.workspace.is_owner_or_member(db=db, workspace_id=workspace_id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    articles = crud.dds_article.get_multi_by_workspace(
        db=db, workspace_id=workspace_id, skip=skip, limit=limit
    )
    return articles


# --- Эндпоинт для создания статьи ---
@router.post("/", response_model=schemas.DdsArticle)
def create_dds_article(
    *,
    db: Session = Depends(get_db),
    article_in: schemas.DdsArticleCreate,
    current_user: models.User = Depends(get_current_active_user),
) -> models.DdsArticle:
    if not crud.workspace.is_owner_or_member(db=db, workspace_id=article_in.workspace_id, user_id=current_user.id):
         raise HTTPException(status_code=403, detail="Not enough permissions for this workspace")
    article = crud.dds_article.create(db=db, obj_in=article_in)
    return article

@router.put("/{article_id}", response_model=schemas.DdsArticle)
def update_dds_article(
    *,
    db: Session = Depends(get_db),
    article_in: schemas.DdsArticleUpdate,
    # Наша новая зависимость сама найдет статью и проверит права.
    # Если что-то не так, она вернет ошибку 404 или 403.
    # Если все хорошо, она вернет объект статьи в переменную `article`.
    article: models.DdsArticle = Depends(get_article_for_user),
) -> Any:
    """
    Обновляет статью ДДС.
    """
    updated_article = crud.dds_article.update(db=db, db_obj=article, obj_in=article_in)
    return updated_article

@router.delete("/{article_id}", response_model=schemas.DdsArticle)
def delete_dds_article(
    *,
    db: Session = Depends(get_db),
    # Наша зависимость найдет статью и проверит права.
    # Если что-то не так, она вернет ошибку 404 или 403.
    article: models.DdsArticle = Depends(get_article_for_user),
) -> Any:
    """
    Удаляет статью ДДС.
    """
    # Проверяем, что у статьи нет дочерних элементов, прежде чем удалять
    if article.children:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete an article that has children. Please delete the children first.",
        )

    deleted_article = crud.dds_article.remove(db=db, id=article.id)
    return deleted_article

@router.get("/tree/", response_model=List[schemas.DdsArticle])
def read_dds_articles_tree(
    *,
    db: Session = Depends(get_db),
    workspace_id: int,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """
    Получает иерархическое дерево статей ДДС для заданного рабочего пространства.
    """
    if not crud.workspace.is_owner_or_member(db=db, workspace_id=workspace_id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    tree = crud.dds_article.get_dds_articles_tree(db=db, workspace_id=workspace_id)
    return tree