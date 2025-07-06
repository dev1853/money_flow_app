# /app/services/dds_article_service.py

from sqlalchemy.orm import Session
from .. import crud, models, schemas
from ..core.exceptions import (
    PermissionDeniedError,
    NotFoundError,
    DdsArticleHasChildrenError,
    DdsArticleInUseError,
    DuplicateEntryError
)

class DdsArticleService:
    """Сервисный слой для управления статьями ДДС."""

    def get_article_by_id(
        self,
        db: Session,
        *,
        article_id: int,
        user: models.User
    ) -> models.DdsArticle:
        """Получает статью по ID и проверяет права доступа."""
        article = crud.dds_article.get(db, id=article_id)
        if not article:
            raise NotFoundError(detail=f"Статья ДДС с ID {article_id} не найдена.")
        
        # Проверяем, что статья принадлежит воркспейсу, к которому у юзера есть доступ
        if article.workspace.owner_id != user.id:
            raise PermissionDeniedError(detail="У вас нет доступа к этой статье ДДС.")
            
        return article

    def create_article(
        self,
        db: Session,
        *,
        article_in: schemas.DdsArticleCreate,
        user: models.User
    ) -> models.DdsArticle:
        """Создает новую статью ДДС с проверкой прав и обработкой ошибок уникальности."""
        workspace = crud.workspace.get(db, id=article_in.workspace_id)
        if not workspace or workspace.owner_id != user.id:
            raise PermissionDeniedError(detail="Недостаточно прав для этого рабочего пространства.")

        # Ручная проверка остается для быстрой и понятной обратной связи
        existing_article = crud.dds_article.get_by_name_and_workspace(
            db, name=article_in.name, workspace_id=article_in.workspace_id
        )
        if existing_article:
            raise DuplicateEntryError(detail=f"Статья с именем '{article_in.name}' уже существует.")

        db_article = crud.dds_article.create_with_owner(
            db=db, obj_in=article_in, owner_id=user.id, workspace_id=article_in.workspace_id
        )
        
        try:
            # Оборачиваем коммит для отлова ошибок уровня БД
            db.commit()
            db.refresh(db_article)
            return db_article
        except IntegrityError:
            # Если БД все же вернула ошибку уникальности
            db.rollback() # Обязательно откатываем транзакцию
            raise DuplicateEntryError(
                detail=f"Статья с именем '{article_in.name}' уже существует (ошибка целостности БД)."
            )

    def update_article(
        self,
        db: Session,
        *,
        article_to_update: models.DdsArticle,
        article_in: schemas.DdsArticleUpdate
    ) -> models.DdsArticle:
        """Обновляет статью ДДС."""
        updated_article = crud.dds_article.update(db=db, db_obj=article_to_update, obj_in=article_in)
        db.commit()
        db.refresh(updated_article)
        return updated_article

    def delete_article(
        self,
        db: Session,
        *,
        article_to_delete: models.DdsArticle
    ) -> models.DdsArticle:
        """Удаляет статью ДДС с проверкой бизнес-ограничений."""
        # 1. Проверка на наличие дочерних элементов
        if article_to_delete.children:
            raise DdsArticleHasChildrenError(
                detail="Нельзя удалить статью, у которой есть дочерние элементы."
            )

        # 2. TODO: Проверка на наличие связанных транзакций
        if crud.transaction.get_count_by_dds_article(db, article_id=article_to_delete.id) > 0:
            raise DdsArticleInUseError(
                detail="Нельзя удалить статью, так как она используется в транзакциях."
            )

        # 3. Удаление
        deleted_article = crud.dds_article.remove(db=db, id=article_to_delete.id)
        db.commit()
        return deleted_article

dds_article_service = DdsArticleService()