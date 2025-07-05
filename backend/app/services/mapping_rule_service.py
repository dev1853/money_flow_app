# app/services/mapping_rule_service.py
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.core.exceptions import (
    NotFoundError,
    PermissionDeniedError,
    DuplicateMappingRuleError,
    DdsArticleInvalidError,
)

class MappingRuleService:
    def get_rule_for_user(self, db: Session, *, rule_id: int, user: models.User) -> models.MappingRule:
        """Получает правило и проверяет, что оно принадлежит пользователю."""
        rule = crud.mapping_rule.get(db, id=rule_id)
        if not rule:
            raise NotFoundError(detail="Правило сопоставления не найдено.")
        if rule.owner_id != user.id:
            raise PermissionDeniedError(detail="Нет прав для доступа к этому правилу.")
        return rule

    def create_rule(
        self, db: Session, *, rule_in: schemas.MappingRuleCreate, user: models.User
    ) -> models.MappingRule:
        """Создает новое правило, выполняя все необходимые проверки."""
        # 1. Проверяем, что воркспейс принадлежит пользователю
        workspace = crud.workspace.get(db, id=rule_in.workspace_id)
        if not workspace or workspace.owner_id != user.id:
            raise PermissionDeniedError(detail="Нет прав для этого рабочего пространства.")

        # 2. Проверяем на дубликат ключевого слова
        existing_rule = crud.mapping_rule.get_by_keyword_and_workspace(
            db, keyword=rule_in.keyword, workspace_id=rule_in.workspace_id
        )
        if existing_rule:
            raise DuplicateMappingRuleError()

        # 3. Создаем правило
        rule = crud.mapping_rule.create_with_owner(
            db, obj_in=rule_in, owner_id=user.id
        )
        return rule

    def update_rule(
        self, db: Session, *, db_rule: models.MappingRule, rule_in: schemas.MappingRuleUpdate
    ) -> models.MappingRule:
        """Обновляет правило, выполняя все необходимые проверки."""
        update_data = rule_in.model_dump(exclude_unset=True)

        # 1. Проверяем статью ДДС, если она меняется
        if "dds_article_id" in update_data and update_data["dds_article_id"] != db_rule.dds_article_id:
            dds_article = crud.dds_article.get(db, id=update_data["dds_article_id"])
            if not dds_article or dds_article.workspace_id != db_rule.workspace_id:
                raise DdsArticleInvalidError()

        # 2. Проверяем на дубликат ключевого слова, если оно меняется
        if "keyword" in update_data and update_data["keyword"] != db_rule.keyword:
            existing_rule = crud.mapping_rule.get_by_keyword_and_workspace(
                db, keyword=update_data["keyword"], workspace_id=db_rule.workspace_id
            )
            if existing_rule:
                raise DuplicateMappingRuleError()

        # 3. Обновляем правило
        return crud.mapping_rule.update(db, db_obj=db_rule, obj_in=update_data)
    
    def delete_rule(self, db: Session, *, db_rule: models.MappingRule) -> models.MappingRule:
        """Удаляет правило."""
        # В будущем здесь можно добавить доп. логику, если потребуется
        return crud.mapping_rule.remove(db=db, id=db_rule.id)

mapping_rule_service = MappingRuleService()