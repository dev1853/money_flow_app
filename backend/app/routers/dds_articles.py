# backend/app/routers/dds_articles.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import crud, schemas, models
from ..dependencies import get_db, get_current_user, get_current_active_user

router = APIRouter(
    prefix="/dds_articles", # Префикс роутера
    tags=["DDS Articles"],
    dependencies=[Depends(get_current_active_user)] # Требует аутентификации
)

@router.get("/", response_model=List[schemas.DDSArticle])
async def read_dds_articles(
    workspace_id: int, # Добавил, чтобы сделать обязательным
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Эта функция должна быть в crud_dds_article.py и возвращать иерархию
    articles = crud.get_dds_articles_hierarchy(db, workspace_id=workspace_id)
    return articles

@router.post("/", response_model=schemas.DDSArticle, status_code=201)
async def create_dds_article(
    article: schemas.DDSArticleCreate,
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    crud.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    db_article = crud.create_dds_article(db=db, article=article, owner_id=current_user.id, workspace_id=workspace_id)
    return db_article

@router.put("/{article_id}", response_model=schemas.DDSArticle)
async def update_dds_article(
    article_id: int,
    article_update: schemas.DDSArticleUpdate,
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    crud.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    db_article = crud.get_dds_article(db, article_id=article_id)
    if not db_article or db_article.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Статья не найдена в данном рабочем пространстве")
    return crud.update_dds_article(db=db, article_id=article_id, article_update=article_update)

@router.delete("/{article_id}", status_code=204) # 204 No Content for successful deletion
async def delete_dds_article(
    article_id: int,
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    crud.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)

    if crud.has_children_articles(db, article_id=article_id):
        raise HTTPException(status_code=400, detail="Невозможно удалить статью, так как у нее есть дочерние элементы.")

    # Если у тебя есть функция проверки транзакций:
    # if crud.has_transactions_with_article(db, article_id=article_id):
    #    raise HTTPException(status_code=400, detail="Невозможно удалить статью, так как она используется в транзакциях.")

    db_article = crud.delete_dds_article(db, article_id=article_id)
    if not db_article or db_article.workspace_id != workspace_id:
         raise HTTPException(status_code=404, detail="Статья не найдена в данном рабочем пространстве")
    # return {"message": "Статья успешно удалена"} # 204 не возвращает тело
    return