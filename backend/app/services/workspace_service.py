# /backend/app/services/workspace_service.py

from sqlalchemy.orm import Session
from .. import crud, models, schemas

class WorkspaceService:
    def create_workspace_for_user(
        self,
        db: Session,
        *,
        workspace_in: schemas.WorkspaceCreate,
        user: models.User
    ) -> models.Workspace:
        """
        Создает новое рабочее пространство и, если у пользователя еще нет
        активного воркспейса, устанавливает созданный как активный.
        """
        try:
            workspace = crud.workspace.create_with_owner(
                db=db, obj_in=workspace_in, owner_id=user.id
            )
            
            # Если это первый воркспейс, делаем его активным
            if user.active_workspace_id is None:
                crud.user.set_active_workspace(db=db, user=user, workspace=workspace)
            
            db.commit()
            db.refresh(workspace)
            db.refresh(user) # Обновляем и пользователя, чтобы active_workspace_id был актуален
            
            return workspace
        except Exception:
            db.rollback()
            raise

    def set_active_workspace(
        self,
        db: Session,
        *,
        user: models.User,
        workspace: models.Workspace
    ) -> models.User:
        """
        Устанавливает активное рабочее пространство для пользователя.
        """
        try:
            updated_user = crud.user.set_active_workspace(db=db, user=user, workspace=workspace)
            db.commit()
            db.refresh(updated_user)
            return updated_user
        except Exception:
            db.rollback()
            raise

# Создаем единственный экземпляр
workspace_service = WorkspaceService()