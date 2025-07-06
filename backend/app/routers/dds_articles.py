# /app/routers/dds_articles.py

import logging 
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..dependencies import get_db, get_current_active_user, get_current_active_workspace
from ..services.dds_article_service import dds_article_service
from ..core.exceptions import (
    NotFoundError,
    PermissionDeniedError,
    DdsArticleHasChildrenError,
    DdsArticleInUseError,
    DuplicateEntryError
)


logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["dds_articles"],
    dependencies=[Depends(get_current_active_user)],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[schemas.DdsArticle])
def read_dds_articles_tree(
    db: Session = Depends(get_db),
    workspace: models.Workspace = Depends(get_current_active_workspace),
) -> Any:
    """Получает иерархическое дерево статей ДДС для текущего рабочего пространства."""
    return crud.dds_article.get_dds_articles_tree(db=db, workspace_id=workspace.id)

@router.post("/", response_model=schemas.DdsArticle, status_code=status.HTTP_201_CREATED)
def create_dds_article(
    *,
    db: Session = Depends(get_db),
    article_in: schemas.DdsArticleCreate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Создать новую статью ДДС."""
    logger.info(
        "Попытка создания статьи ДДС '%s' для workspace %d",
        article_in.name,
        article_in.workspace_id,
    )
    try:
        article = dds_article_service.create_article(
            db=db, article_in=article_in, user=current_user
        )
        logger.info("Статья ДДС с ID %d успешно создана.", article.id)
        return article
    except PermissionDeniedError as e:
        logger.warning("Ошибка доступа при создании статьи ДДС: %s", e.detail)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.detail)
    except DuplicateEntryError as e:
        logger.warning("Попытка создания дубликата статьи ДДС: %s", e.detail)
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=e.detail)
    except Exception as e:
        # 3. Логируем настоящую, скрытую ошибку с полным стектрейсом
        logger.error(
            "Непредвиденная ошибка при создании статьи ДДС: %s", e, exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Внутренняя ошибка сервера",
        )

@router.put("/{article_id}", response_model=schemas.DdsArticle)
def update_dds_article(
    *,
    db: Session = Depends(get_db),
    article_id: int,
    article_in: schemas.DdsArticleUpdate,
    current_user: models.User = Depends(get_current_active_user)
) -> Any:
    """Обновить статью ДДС."""
    try:
        article_to_update = dds_article_service.get_article_by_id(db, article_id=article_id, user=current_user)
        return dds_article_service.update_article(
            db=db, article_to_update=article_to_update, article_in=article_in
        )
    except (NotFoundError, PermissionDeniedError) as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.detail)
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Внутренняя ошибка сервера")

@router.delete("/{article_id}", response_model=schemas.DdsArticle)
def delete_dds_article(
    *,
    db: Session = Depends(get_db),
    article_id: int,
    current_user: models.User = Depends(get_current_active_user)
) -> Any:
    """Удалить статью ДДС."""
    try:
        article_to_delete = dds_article_service.get_article_by_id(db, article_id=article_id, user=current_user)
        return dds_article_service.delete_article(db=db, article_to_delete=article_to_delete)
    except (NotFoundError, PermissionDeniedError) as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.detail)
    except (DdsArticleHasChildrenError, DdsArticleInUseError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.detail)
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Внутренняя ошибка сервера")