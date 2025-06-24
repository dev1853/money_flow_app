# backend/app/routers/mapping_rules.py

from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request # <--- Убедитесь, что Request импортирован
from sqlalchemy.orm import Session

from app import crud, schemas, models
from app.dependencies import get_db, get_current_active_user
from app.schemas import TransactionType
from datetime import date 

router = APIRouter(
    tags=["mapping_rules"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=schemas.MappingRulePage)
def read_mapping_rules(
    request: Request, # <--- 1. Параметр без значения по умолчанию
    workspace_id: int = Query(..., description="ID рабочего пространства"), # <--- 2. Параметр Query без значения по умолчанию
    db: Session = Depends(get_db), # <--- 3. Параметры со значениями по умолчанию
    current_user: models.User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0, description="Количество пропускаемых элементов"),
    limit: int = Query(100, ge=1, le=100, description="Количество элементов на странице"),
) -> Any:
    """
    Получает пагинированный список правил сопоставления с фильтрами.
    """
    print(f"DEBUG (Mapping Rules Router - GET): Request received for workspace_id={workspace_id}, skip={skip}, limit={limit}") 
    print(f"DEBUG (Mapping Rules Router - GET): Raw query parameters from Request: {request.query_params}") 
    
    # Проверка на принадлежность рабочего пространства
    crud.workspace.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)

    rules_data = crud.mapping_rule.get_multi_by_owner_and_workspace(
        db=db, 
        owner_id=current_user.id, 
        workspace_id=workspace_id, 
        skip=skip, 
        limit=limit
    )
    
    print(f"DEBUG (Mapping Rules Router - GET): Data returned from CRUD: {rules_data}") 
    print(f"DEBUG (Mapping Rules Router - GET): Type of data returned from CRUD: {type(rules_data)}") 

    return rules_data

@router.get("/{rule_id}", response_model=schemas.MappingRule)
def read_mapping_rule_by_id(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """
    Получить правило сопоставления по ID.
    """
    mapping_rule = crud.mapping_rule.get(db, id=rule_id)
    if not mapping_rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Правило сопоставления не найдено.")
    if mapping_rule.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="У вас нет прав для доступа к этому правилу.")
    return mapping_rule

@router.put("/{rule_id}", response_model=schemas.MappingRule)
def update_mapping_rule(
    *,
    db: Session = Depends(get_db),
    rule_id: int,
    mapping_rule_in: schemas.MappingRuleUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """
    Обновить существующее правило сопоставления.
    """
    mapping_rule = crud.mapping_rule.get(db, id=rule_id)
    if not mapping_rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Правило сопоставления не найдено.")
    if mapping_rule.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="У вас нет прав для изменения этого правила.")

    # Проверка, если dds_article_id меняется, что он принадлежит пользователю и воркспейсу
    if mapping_rule_in.dds_article_id is not None and mapping_rule_in.dds_article_id != mapping_rule.dds_article_id:
        dds_article = crud.dds_article.get(db, id=mapping_rule_in.dds_article_id)
        if not dds_article or dds_article.owner_id != current_user.id or dds_article.workspace_id != mapping_rule.workspace_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Указанная статья ДДС не существует или не принадлежит текущему пользователю/рабочему пространству.",
            )

    # Проверка на дублирование ключевого слова, если оно меняется
    if mapping_rule_in.keyword is not None and mapping_rule_in.keyword != mapping_rule.keyword:
        existing_rule = db.query(models.MappingRule).filter(
            models.MappingRule.keyword == mapping_rule_in.keyword,
            models.MappingRule.owner_id == current_user.id,
            models.MappingRule.workspace_id == mapping_rule.workspace_id, # Важно: в рамках того же workspace
        ).first()
        if existing_rule:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Правило с таким ключевым словом уже существует для вашего рабочего пространства.",
            )

    mapping_rule = crud.mapping_rule.update(db=db, db_obj=mapping_rule, obj_in=mapping_rule_in)
    return mapping_rule

@router.delete("/{rule_id}", response_model=schemas.MappingRule)
def delete_mapping_rule(
    *,
    db: Session = Depends(get_db),
    rule_id: int,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """
    Удалить правило сопоставления.
    """
    mapping_rule = crud.mapping_rule.get(db, id=rule_id)
    if not mapping_rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Правило сопоставления не найдено.")
    if mapping_rule.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="У вас нет прав для удаления этого правила.")
    
    mapping_rule = crud.mapping_rule.remove(db=db, id=rule_id)
    return mapping_rule