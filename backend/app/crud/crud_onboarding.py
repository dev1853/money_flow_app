# backend/app/crud/crud_onboarding.py

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError 
from app import models, schemas, crud
import json 
from typing import List, Dict, Any

# Определяем универсальные правила сопоставления по умолчанию
# ... (DEFAULT_MAPPING_RULES_DATA остается без изменений) ...
DEFAULT_MAPPING_RULES_DATA = [
    {"keyword": "Перевод", "dds_article_name": "Поступления от клиентов", "transaction_type": "income", "priority": 10},
    {"keyword": "Оплата", "dds_article_name": "Поступления от клиентов", "transaction_type": "income", "priority": 9},
    {"keyword": "Зарплата", "dds_article_name": "Поступления от клиентов", "transaction_type": "income", "priority": 8},
    {"keyword": "Аванс", "dds_article_name": "Авансы от покупателей", "transaction_type": "income", "priority": 7},
    
    {"keyword": "Магазин", "dds_article_name": "Прочие операционные расходы", "transaction_type": "expense", "priority": 10},
    {"keyword": "Супермаркет", "dds_article_name": "create_default_mapping_rules операционные расходы", "transaction_type": "expense", "priority": 9},
    {"keyword": "Кафе", "dds_article_name": "Прочие операционные расходы", "transaction_type": "expense", "priority": 8},
    {"keyword": "Такси", "dds_article_name": "Транспортные расходы", "transaction_type": "expense", "priority": 10},
    {"keyword": "Бензин", "dds_article_name": "Транспортные расходы", "transaction_type": "expense", "priority": 9},
    {"keyword": "Аренда", "dds_article_name": "Аренда", "transaction_type": "expense", "priority": 10},
    {"keyword": "Зарплата", "dds_article_name": "Оплата труда", "transaction_type": "expense", "priority": 10},
    {"keyword": "Налоги", "dds_article_name": "Налоги и взносы", "transaction_type": "expense", "priority": 10},
    {"keyword": "Поставщик", "dds_article_name": "Платежи поставщикам", "transaction_type": "expense", "priority": 10},
    {"keyword": "Комиссия", "dds_article_name": "Прочие операционные расходы", "transaction_type": "expense", "priority": 5},
    {"keyword": "Банк", "dds_article_name": "Прочие операционные расходы", "transaction_type": "expense", "priority": 4},
]


def create_default_mapping_rules(db: Session, *, workspace_id: int, owner_id: int):
    """
    Создает правила сопоставления по умолчанию для нового рабочего пространства.
    """
    print(f"--- DEBUG (Onboarding): Creating default mapping rules for workspace {workspace_id} ---")
    
    dds_articles = crud.dds_article.get_multi_by_workspace(db=db, workspace_id=workspace_id)
    
    article_name_to_id = {
        (article.name, article.type): article.id 
        for article in dds_articles 
        if article.type != 'group' 
    }

    created_rules_count = 0
    for rule_data in DEFAULT_MAPPING_RULES_DATA:
        article_name = rule_data["dds_article_name"]
        transaction_type_for_rule = rule_data["transaction_type"]

        dds_article_id = None
        if (article_name, transaction_type_for_rule) in article_name_to_id:
            dds_article_id = article_name_to_id[(article_name, transaction_type_for_rule)]
        else:
            print(f"--- WARNING (Onboarding): DDS Article '{article_name}' with type '{transaction_type_for_rule}' not found for rule '{rule_data['keyword']}'. Skipping rule.")
            continue

        if dds_article_id:
            try:
                rule_in = schemas.MappingRuleCreate(
                    keyword=rule_data["keyword"],
                    dds_article_id=dds_article_id,
                    transaction_type=rule_data["transaction_type"],
                    priority=rule_data["priority"],
                    is_active=True,
                    owner_id=owner_id,
                    workspace_id=workspace_id
                )
                crud.mapping_rule.create(db=db, obj_in=rule_in)
                created_rules_count += 1
            except IntegrityError as e: 
                db.rollback()
                # Проверяем, что это ошибка уникальности по ключевому слову
                if "ix_mapping_rules_keyword" in str(e) or "duplicate key value violates unique constraint" in str(e):
                    print(f"--- WARNING (Onboarding): Mapping rule with keyword '{rule_data['keyword']}' already exists. Skipping duplicate.")
                else:
                    # Если это другая IntegrityError, перевыбрасываем её
                    print(f"--- ERROR (Onboarding): Unexpected IntegrityError for rule '{rule_data['keyword']}': {e}")
                    raise
            except Exception as e:
                db.rollback() # <--- Также откатываем, если произошла другая непредвиденная ошибка
                print(f"--- ERROR (Onboarding): General error creating mapping rule '{rule_data['keyword']}': {e}")
                raise # Перевыбрасываем, если это не предвиденная ошибка
                
    print(f"--- DEBUG (Onboarding): Created {created_rules_count} default mapping rules.")


def onboard_new_user(db: Session, *, user: models.User):
    """
    Создает все сущности по умолчанию для нового пользователя.
    """
    # 1. Создаем рабочее пространство
    workspace_schema = schemas.WorkspaceCreate(name=f"Пространство {user.username}")
    db_workspace = crud.workspace.create_with_owner(db=db, obj_in=workspace_schema, owner_id=user.id)
    
    # 2. Создаем статьи ДДС (ВАЖНО: они должны быть созданы до правил сопоставления)
    crud.dds_article.create_default_articles(db=db, workspace_id=db_workspace.id, owner_id=user.id)
    
    # 3. Создаем счета
    crud.account.create_default_accounts(db=db, workspace_id=db_workspace.id, owner_id=user.id)

    # 4. НОВОЕ: Создаем правила сопоставления по умолчанию
    create_default_mapping_rules(db=db, workspace_id=db_workspace.id, owner_id=user.id)

    # Последний шаг - устанавливаем рабочее пространство активным
    user.active_workspace_id = db_workspace.id
    db.add(user)
    db.commit()
    print(f"--- DEBUG (Onboarding): User {user.username} onboarded with workspace {db_workspace.name} and default data.")