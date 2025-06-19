# backend/app/routers/dds_articles.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional 
from .. import crud, models, schemas
from ..dependencies import get_db, get_current_active_user, get_current_active_superuser

router = APIRouter(
    tags=["dds_articles"],
    dependencies=[Depends(get_current_active_user)]
)

@router.get("/", response_model=List[schemas.DdsArticle])
def read_dds_articles(
    workspace_id: int = Query(..., description="ID рабочего пространства"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Получает список статей ДДС для указанного рабочего пространства, включая иерархию.
    """
    crud.workspace.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    
    articles = crud.dds_article.get_dds_articles_tree(db, workspace_id=workspace_id)
    
    return articles