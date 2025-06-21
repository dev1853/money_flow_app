# backend/app/routers/mapping_rules.py

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import crud, schemas, models
from app.dependencies import get_db, get_current_active_user

router = APIRouter(
    tags=["mapping_rules"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.MappingRule, status_code=status.HTTP_201_CREATED)
def create_mapping_rule(
    *,
    db: Session = Depends(get_db),
    mapping_rule_in: schemas.MappingRuleCreate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """
    Создать новое правило сопоставления.
    """
    # Проверяем, что dds_article_id принадлежит текущему пользователю и рабочему пространству
    dds_article = crud.dds_article.get(db, id=mapping_rule_in.dds_article_id)
    if not dds_article or dds_article.owner_id != current_user.id or dds_article.workspace_id != mapping_rule_in.workspace_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Указанная статья ДДС не существует или не принадлежит текущему пользователю/рабочему пространству.",
        )

    # Убеждаемся, что правило с таким ключевым словом для этого пользователя/воркспейса еще не существует
    # (хотя в модели keyword unique=True, но дополнительная проверка не помешает)
    existing_rule = db.query(models.MappingRule).filter(
        models.MappingRule.keyword == mapping_rule_in.keyword,
        models.MappingRule.owner_id == current_user.id,
        models.MappingRule.workspace_id == mapping_rule_in.workspace_id,
    ).first()
    if existing_rule:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Правило с таким ключевым словом уже существует для вашего рабочего пространства.",
        )
    
    mapping_rule = crud.mapping_rule.create(db=db, obj_in=mapping_rule_in)
    return mapping_rule

@router.get("/", response_model=List[schemas.MappingRule])
def read_mapping_rules(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    workspace_id: int = None, # Мы сделаем его обязательным для получения списка правил
) -> Any:
    """
    Получить все правила сопоставления для текущего пользователя,
    обязательно указав рабочее пространство.
    """
    if workspace_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Параметр 'workspace_id' является обязательным для получения правил сопоставления.",
        )
    
    # ИСПРАВЛЕНО: Используем crud.workspace.validate_workspace_owner
    # Эта функция проверит принадлежность рабочего пространства и выбросит HTTPException, если что-то не так.
    # Если все в порядке, она вернет объект рабочего пространства, но нам здесь он не нужен напрямую.
    crud.workspace.validate_workspace_owner(db, workspace_id=workspace_id, user_id=current_user.id)
    
    rules = crud.mapping_rule.get_multi_by_owner_and_workspace(
        db=db, owner_id=current_user.id, workspace_id=workspace_id, skip=skip, limit=limit
    )
    return rules

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