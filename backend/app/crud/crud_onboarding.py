# backend/app/crud/crud_onboarding.py

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app import models, schemas, crud
import json 
from typing import List, Dict, Any

# Определяем универсальные правила сопоставления по умолчанию
# Максимально возможный список правил для автоматического разнесения платежей
DEFAULT_MAPPING_RULES_DATA = [
    # --- Операционная деятельность - Поступления (Income) ---
    {"keyword": "Поступления от клиентов", "dds_article_name": "Поступления от клиентов", "transaction_type": "income", "priority": 100},
    {"keyword": "Оплата клиента", "dds_article_name": "Поступления от клиентов", "transaction_type": "income", "priority": 95},
    {"keyword": "Выручка", "dds_article_name": "Поступления от клиентов", "transaction_type": "income", "priority": 90},
    {"keyword": "Доход", "dds_article_name": "Поступления от клиентов", "transaction_type": "income", "priority": 85},
    {"keyword": "Прибыль", "dds_article_name": "Поступления от клиентов", "transaction_type": "income", "priority": 80},
    {"keyword": "Возврат от поставщика", "dds_article_name": "Поступления от клиентов", "transaction_type": "income", "priority": 75},
    {"keyword": "Продажа услуг", "dds_article_name": "Поступления от клиентов", "transaction_type": "income", "priority": 70},
    {"keyword": "Продажа товаров", "dds_article_name": "Поступления от клиентов", "transaction_type": "income", "priority": 70},
    {"keyword": "Зарплата", "dds_article_name": "Поступления от клиентов", "transaction_type": "income", "priority": 60}, # Если это поступления зп на личный счет
    {"keyword": "Аванс от покупателя", "dds_article_name": "Авансы от покупателей", "transaction_type": "income", "priority": 100},
    {"keyword": "Предоплата", "dds_article_name": "Авансы от покупателей", "transaction_type": "income", "priority": 90},
    {"keyword": "Задаток", "dds_article_name": "Авансы от покупателей", "transaction_type": "income", "priority": 80},
    {"keyword": "Перечисление", "dds_article_name": "Поступления от клиентов", "transaction_type": "income", "priority": 5}, # Более общее
    {"keyword": "Получение", "dds_article_name": "Поступления от клиентов", "transaction_type": "income", "priority": 4}, # Более общее

    # --- Операционная деятельность - Платежи (Expense) ---
    {"keyword": "Платежи поставщикам", "dds_article_name": "Платежи поставщикам", "transaction_type": "expense", "priority": 100},
    {"keyword": "Оплата поставщику", "dds_article_name": "Платежи поставщикам", "transaction_type": "expense", "priority": 95},
    {"keyword": "Закупка", "dds_article_name": "Платежи поставщикам", "transaction_type": "expense", "priority": 90},
    {"keyword": "Покупка материалов", "dds_article_name": "Платежи поставщикам", "transaction_type": "expense", "priority": 85},
    {"keyword": "Товары", "dds_article_name": "Платежи поставщикам", "transaction_type": "expense", "priority": 80},
    {"keyword": "Сырье", "dds_article_name": "Платежи поставщикам", "transaction_type": "expense", "priority": 80},
    {"keyword": "Услуги", "dds_article_name": "Платежи поставщикам", "transaction_type": "expense", "priority": 70}, # Если это внешние услуги
    {"keyword": "Оплата труда", "dds_article_name": "Оплата труда", "transaction_type": "expense", "priority": 100},
    {"keyword": "ЗП", "dds_article_name": "Оплата труда", "transaction_type": "expense", "priority": 95},
    {"keyword": "Аванс ЗП", "dds_article_name": "Оплата труда", "transaction_type": "expense", "priority": 90},
    {"keyword": "Отпускные", "dds_article_name": "Оплата труда", "transaction_type": "expense", "priority": 85},
    {"keyword": "Премия", "dds_article_name": "Оплата труда", "transaction_type": "expense", "priority": 85},
    {"keyword": "Налоги", "dds_article_name": "Налоги и взносы", "transaction_type": "expense", "priority": 100},
    {"keyword": "НДС", "dds_article_name": "Налоги и взносы", "transaction_type": "expense", "priority": 95},
    {"keyword": "ПФР", "dds_article_name": "Налоги и взносы", "transaction_type": "expense", "priority": 90},
    {"keyword": "ФСС", "dds_article_name": "Налоги и взносы", "transaction_type": "expense", "priority": 90},
    {"keyword": "Страховые взносы", "dds_article_name": "Налоги и взносы", "transaction_type": "expense", "priority": 85},
    {"keyword": "Аренда", "dds_article_name": "Аренда", "transaction_type": "expense", "priority": 100},
    {"keyword": "Офис", "dds_article_name": "Аренда", "transaction_type": "expense", "priority": 95},
    {"keyword": "Помещение", "dds_article_name": "Аренда", "transaction_type": "expense", "priority": 90},
    {"keyword": "Коммунальные", "dds_article_name": "Прочие операционные расходы", "transaction_type": "expense", "priority": 90},
    {"keyword": "Электричество", "dds_article_name": "Прочие операционные расходы", "transaction_type": "expense", "priority": 85},
    {"keyword": "Вода", "dds_article_name": "Прочие операционные расходы", "transaction_type": "expense", "priority": 80},
    {"keyword": "Интернет", "dds_article_name": "Прочие операционные расходы", "transaction_type": "expense", "priority": 85},
    {"keyword": "Телефон", "dds_article_name": "Прочие операционные расходы", "transaction_type": "expense", "priority": 80},
    {"keyword": "Связь", "dds_article_name": "Прочие операционные расходы", "transaction_type": "expense", "priority": 75},
    {"keyword": "Хозтовары", "dds_article_name": "Прочие операционные расходы", "transaction_type": "expense", "priority": 70},
    {"keyword": "Канцтовары", "dds_article_name": "Прочие операционные расходы", "transaction_type": "expense", "priority": 70},
    {"keyword": "Курьер", "dds_article_name": "Прочие операционные расходы", "transaction_type": "expense", "priority": 75},
    {"keyword": "Доставка", "dds_article_name": "Прочие операционные расходы", "transaction_type": "expense", "priority": 75},
    {"keyword": "Такси", "dds_article_name": "Прочие операционные расходы", "transaction_type": "expense", "priority": 90},
    {"keyword": "ГСМ", "dds_article_name": "Прочие операционные расходы", "transaction_type": "expense", "priority": 85},
    {"keyword": "Бензин", "dds_article_name": "Прочие операционные расходы", "transaction_type": "expense", "priority": 85},
    {"keyword": "Реклама", "dds_article_name": "Прочие операционные расходы", "transaction_type": "expense", "priority": 100},
    {"keyword": "Маркетинг", "dds_article_name": "Прочие операционные расходы", "transaction_type": "expense", "priority": 95},
    {"keyword": "Консультация", "dds_article_name": "Прочие операционные расходы", "transaction_type": "expense", "priority": 80},
    {"keyword": "Командировка", "dds_article_name": "Прочие операционные расходы", "transaction_type": "expense", "priority": 80},
    {"keyword": "Банк", "dds_article_name": "Прочие операционные расходы", "transaction_type": "expense", "priority": 70},
    {"keyword": "Комиссия", "dds_article_name": "Прочие операционные расходы", "transaction_type": "expense", "priority": 70},
    {"keyword": "Штраф", "dds_article_name": "Прочие операционные расходы", "transaction_type": "expense", "priority": 60},
    {"keyword": "Пени", "dds_article_name": "Прочие операционные расходы", "transaction_type": "expense", "priority": 60},
    {"keyword": "Обслуживание", "dds_article_name": "Прочие операционные расходы", "transaction_type": "expense", "priority": 65},
    {"keyword": "Регистрация", "dds_article_name": "Прочие операционные расходы", "transaction_type": "expense", "priority": 65},
    {"keyword": "Лицензия", "dds_article_name": "Прочие операционные расходы", "transaction_type": "expense", "priority": 65},

    # --- Инвестиционная деятельность - Поступления ---
    {"keyword": "Продажа ОС", "dds_article_name": "Продажа основных средств", "transaction_type": "income", "priority": 100},
    {"keyword": "Реализация ОС", "dds_article_name": "Продажа основных средств", "transaction_type": "income", "priority": 95},
    {"keyword": "Дивиденды", "dds_article_name": "Полученные дивиденды", "transaction_type": "income", "priority": 100},
    {"keyword": "Проценты по вкладам", "dds_article_name": "Полученные дивиденды", "transaction_type": "income", "priority": 95},

    # --- Инвестиционная деятельность - Платежи ---
    {"keyword": "Покупка ОС", "dds_article_name": "Покупка основных средств", "transaction_type": "expense", "priority": 100},
    {"keyword": "Приобретение ОС", "dds_article_name": "Покупка основных средств", "transaction_type": "expense", "priority": 95},

    # --- Финансовая деятельность - Поступления ---
    {"keyword": "Получение кредита", "dds_article_name": "Получение кредитов и займов", "transaction_type": "income", "priority": 100},
    {"keyword": "Взял кредит", "dds_article_name": "Получение кредитов и займов", "transaction_type": "income", "priority": 95},
    {"keyword": "Получение займа", "dds_article_name": "Получение кредитов и займов", "transaction_type": "income", "priority": 95},
    {"keyword": "Займ получен", "dds_article_name": "Получение кредитов и займов", "transaction_type": "income", "priority": 90},

    # --- Финансовая деятельность - Платежи ---
    {"keyword": "Погашение кредита", "dds_article_name": "Погашение кредитов и займов", "transaction_type": "expense", "priority": 100},
    {"keyword": "Возврат займа", "dds_article_name": "Погашение кредитов и займов", "transaction_type": "expense", "priority": 95},
    {"keyword": "Выплата кредита", "dds_article_name": "Погашение кредитов и займов", "transaction_type": "expense", "priority": 90},
]


def create_default_mapping_rules(db: Session, *, workspace_id: int, owner_id: int):
    """
    Создает правила сопоставления по умолчанию для нового рабочего пространства.
    """
    print(f"--- DEBUG (Onboarding): Creating default mapping rules for workspace {workspace_id} ---")
    
    # Сначала получаем все статьи ДДС для этого рабочего пространства, чтобы сопоставить их по имени
    dds_articles = crud.dds_article.get_multi_by_workspace(db=db, workspace_id=workspace_id)
    
    # Создаем словарь для быстрого поиска ID статей по их имени и типу
    article_name_to_id = {
        (article.name, article.type): article.id 
        for article in dds_articles 
        if article.type != 'group' # Исключаем групповые статьи
    }

    created_rules_count = 0
    for rule_data in DEFAULT_MAPPING_RULES_DATA:
        article_name = rule_data["dds_article_name"]
        transaction_type_for_rule = rule_data["transaction_type"]

        dds_article_id = None
        # Пробуем найти точное совпадение по имени И типу
        if (article_name, transaction_type_for_rule) in article_name_to_id:
            dds_article_id = article_name_to_id[(article_name, transaction_type_for_rule)]
        else:
            # Если не найдено точного совпадения, возможно, статья была переименована или отсутствует
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
                if "ix_mapping_rules_keyword" in str(e) or "duplicate key value violates unique constraint" in str(e) or "unique constraint" in str(e):
                    print(f"--- WARNING (Onboarding): Mapping rule with keyword '{rule_data['keyword']}' already exists for this workspace. Skipping duplicate.")
                else:
                    print(f"--- ERROR (Onboarding): Unexpected IntegrityError for rule '{rule_data['keyword']}': {e}")
                    raise 
            except Exception as e:
                db.rollback() 
                print(f"--- ERROR (Onboarding): General error creating mapping rule '{rule_data['keyword']}': {e}")
                raise 
                
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