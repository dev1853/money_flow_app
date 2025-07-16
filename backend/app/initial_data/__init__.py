# /backend/app/initial_data/__init__.py

import logging
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Type
from app.models.role import Role
from app.models.account import AccountType 
from ..database import Base 

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Данные для инициализации ---

ROLES: List[Dict[str, Any]] = [
    {"id": 1, "name": "admin", "description": "Администратор с полными правами"},
    {"id": 2, "name": "user", "description": "Обычный пользователь системы"},
]

ACCOUNT_TYPES: List[Dict[str, Any]] = [
    {"id": 1, "name": "Банковский счет", "code": "bank_account"},
    {"id": 2, "name": "Касса", "code": "cash"},
]

# --- Улучшенная логика ---

def _ensure_data(db: Session, model: Type[Base], data_list: List[Dict[str, Any]]) -> None:
    """
    Универсальная функция для проверки и создания записей в справочных таблицах.
    
    :param db: Сессия базы данных.
    :param model: Класс модели SQLAlchemy (например, Role).
    :param data_list: Список словарей с данными для создания.
    """
    model_name = model.__tablename__
    logger.info(f"Проверка и создание данных для таблицы '{model_name}'...")
    
    existing_ids = {item.id for item in db.query(model.id).all()}
    
    items_to_create = [
        item for item in data_list if item["id"] not in existing_ids
    ]

    if not items_to_create:
        logger.info(f"Все необходимые записи в таблице '{model_name}' уже существуют.")
        return

    for item_data in items_to_create:
        db_item = model(**item_data)
        db.add(db_item)
        logger.info(f"Запись '{item_data['name']}' (ID: {item_data['id']}) для '{model_name}' подготовлена к созданию.")
    
    logger.info(f"Будет создано {len(items_to_create)} новых записей в таблице '{model_name}'.")

def init_db(db: Session) -> None:
    """
    Инициализирует базу данных всеми необходимыми справочными данными.
    Все операции выполняются в одной транзакции.
    """
    logger.info("Запуск инициализации базовых данных...")
    try:
        # Вызываем универсальную функцию для каждой модели
        _ensure_data(db, Role, ROLES)
        _ensure_data(db, AccountType, ACCOUNT_TYPES)
        # Сюда можно добавлять вызовы для других справочников в будущем

        db.commit()
        logger.info("Инициализация базовых данных успешно завершена.")
    except Exception as e:
        logger.error(f"Произошла критическая ошибка во время инициализации данных: {e}", exc_info=True)
        # В случае любой ошибки откатываем все изменения
        db.rollback()
        raise