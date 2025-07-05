# app/routers/mapping_rules.py
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.dependencies import get_db, get_current_active_user, get_current_active_workspace
from app.services.mapping_rule_service import mapping_rule_service
from app.core.exceptions import (
    NotFoundError,
    PermissionDeniedError,
    DuplicateMappingRuleError,
    DdsArticleInvalidError,
)

router = APIRouter(
    tags=["mapping_rules"],
    dependencies=[Depends(get_current_active_user)],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=schemas.MappingRulePage)
def read_mapping_rules(
    db: Session = Depends(get_db),
    workspace: models.Workspace = Depends(get_current_active_workspace),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
) -> Any:
    """Получает пагинированный список правил для активного воркспейса."""
    rules, total_count = crud.mapping_rule.get_paginated_by_workspace(
        db=db, workspace_id=workspace.id, skip=skip, limit=limit
    )
    return {"mapping_rules": rules, "total_count": total_count}

@router.post("/", response_model=schemas.MappingRule, status_code=status.HTTP_201_CREATED)
def create_mapping_rule(
    *,
    db: Session = Depends(get_db),
    rule_in: schemas.MappingRuleCreate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    try:
        rule = mapping_rule_service.create_rule(db=db, rule_in=rule_in, user=current_user)
        db.commit()
        db.refresh(rule)
        return rule
    except (PermissionDeniedError, DdsArticleInvalidError) as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.detail)
    except DuplicateMappingRuleError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=e.detail)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

@router.put("/{rule_id}", response_model=schemas.MappingRule)
def update_mapping_rule(
    *,
    db: Session = Depends(get_db),
    rule_id: int,
    rule_in: schemas.MappingRuleUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    try:
        db_rule = mapping_rule_service.get_rule_for_user(db=db, rule_id=rule_id, user=current_user)
        updated_rule = mapping_rule_service.update_rule(db=db, db_rule=db_rule, rule_in=rule_in)
        db.commit()
        db.refresh(updated_rule)
        return updated_rule
    except (NotFoundError, DdsArticleInvalidError) as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.detail)
    except PermissionDeniedError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=e.detail)
    except DuplicateMappingRuleError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=e.detail)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

@router.delete("/{rule_id}", response_model=schemas.MappingRule)
def delete_mapping_rule(
    *,
    db: Session = Depends(get_db),
    rule_id: int,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    try:
        db_rule = mapping_rule_service.get_rule_for_user(db=db, rule_id=rule_id, user=current_user)
        deleted_rule = mapping_rule_service.delete_rule(db=db, db_rule=db_rule)
        db.commit()
        return deleted_rule
    except (NotFoundError, PermissionDeniedError) as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.detail)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)