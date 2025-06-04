# app/crud.py
import csv
import io
import json
import os
import logging
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_
from typing import List, Optional, Dict, Tuple
from datetime import date, timedelta, datetime
from decimal import Decimal, InvalidOperation 

from . import models, schemas
from .auth_utils import get_password_hash # Предполагается, что get_password_hash находится здесь


# Настройка логирования
logger = logging.getLogger(__name__)
# Если у тебя нет глобальной настройки логирования, можешь добавить базовую:
# logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


# --- Вспомогательная функция для обновления баланса ---
def _update_account_balance_for_transaction(
    db: Session, 
    account_id: int, 
    workspace_id: int, # Добавляем workspace_id для дополнительной проверки
    amount: Decimal, 
    article_type: str, 
    operation: str = "apply"
) -> bool:
    """
    Обновляет баланс счета.
    operation: "apply" (применить транзакцию) или "revert" (откатить транзакцию)
    Возвращает True в случае успеха, False, если счет не найден.
    """
    # Фильтруем счет не только по ID, но и по workspace_id
    account_to_update = db.query(models.Account).filter(
        models.Account.id == account_id,
        models.Account.workspace_id == workspace_id
    ).first()

    if account_to_update:
        if article_type == 'income':
            if operation == "apply":
                account_to_update.current_balance += amount
            elif operation == "revert":
                account_to_update.current_balance -= amount
        elif article_type == 'expense':
            if operation == "apply":
                account_to_update.current_balance -= amount
            elif operation == "revert":
                account_to_update.current_balance += amount
        db.add(account_to_update) # SQLAlchemy отследит изменения
        return True
    logger.error(f"Не найден счет ID {account_id} в рабочем пространстве {workspace_id} для обновления баланса.")
    return False

# --- Загрузка правил сопоставления ключевых слов для статей ДДС ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RULES_FILE_PATH = os.path.join(os.path.dirname(BASE_DIR), "dds_keyword_mapping_rules.json")

KEYWORD_TO_DDS_ARTICLE_MAP_FROM_FILE = {}
try:
    with open(RULES_FILE_PATH, 'r', encoding='utf-8') as f:
        KEYWORD_TO_DDS_ARTICLE_MAP_FROM_FILE = json.load(f)
    logger.info(f"Правила сопоставления ключевых слов успешно загружены из {RULES_FILE_PATH}")
except FileNotFoundError:
    logger.warning(f"Файл правил {RULES_FILE_PATH} не найден. Автоматическое определение статей по ключевым словам не будет работать, будут использоваться статьи по умолчанию.")
except json.JSONDecodeError as e:
    logger.error(f"Не удалось декодировать JSON из файла правил {RULES_FILE_PATH}: {e}")
except Exception as e:
    logger.error(f"Непредвиденная ошибка при загрузке правил из {RULES_FILE_PATH}: {e}")


# ==================================
# CRUD операции для Пользователей (Users)
# ==================================

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    """Получает пользователя по ID."""
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    """Получает пользователя по имени пользователя."""
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    """Получает пользователя по email."""
    return db.query(models.User).filter(models.User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    """Получает список активных пользователей."""
    return db.query(models.User).filter(models.User.is_active == True).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate, workspace_id: int) -> models.User:
    """
    Создает нового пользователя и связывает его с рабочим пространством.
    Коммит и рефреш происходят в эндпоинте.
    """
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        full_name=user.full_name,
        is_active=user.is_active,
        role_id=user.role_id,
        workspace_id=workspace_id
    )
    db.add(db_user)
    return db_user

def update_user_by_admin(db: Session, user_id: int, user_update: schemas.UserUpdateAdmin) -> Optional[models.User]:
    """Обновляет данные пользователя администратором."""
    db_user = get_user(db, user_id=user_id)
    if not db_user:
        return None

    update_data = user_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key == "password": # Пароль обновляется через отдельную функцию
            continue
        setattr(db_user, key, value)
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int) -> Optional[models.User]:
    """
    Деактивирует пользователя вместо физического удаления.
    Это более безопасный подход для сохранения исторических данных.
    """
    db_user = get_user(db, user_id=user_id)
    if db_user:
        db_user.is_active = False
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        logger.info(f"Пользователь ID {user_id} деактивирован.")
        return db_user
    return None

# ==================================
# CRUD операции для Ролей (Roles)
# ==================================

def get_role(db: Session, role_id: int) -> Optional[models.Role]:
    """Получает роль по ID."""
    return db.query(models.Role).filter(models.Role.id == role_id).first()

def get_role_by_name(db: Session, name: str) -> Optional[models.Role]:
    """Получает роль по имени."""
    return db.query(models.Role).filter(models.Role.name == name).first()

def get_roles(db: Session, skip: int = 0, limit: int = 100) -> List[models.Role]:
    """Получает список всех ролей."""
    return db.query(models.Role).offset(skip).limit(limit).all()

def create_role(db: Session, role: schemas.RoleCreate) -> models.Role:
    """Создает новую роль."""
    db_role = models.Role(
        name=role.name, 
        description=role.description,
        permissions=role.permissions or {}
    )
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

def update_role(db: Session, role_id: int, role_update: schemas.RoleUpdate) -> Optional[models.Role]:
    """Обновляет существующую роль."""
    db_role = get_role(db, role_id=role_id)
    if not db_role:
        return None
    
    update_data = role_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_role, key, value)
    
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

def delete_role(db: Session, role_id: int) -> Optional[models.Role]:
    """
    Удаляет роль.
    Примечание: В реальном приложении нужна проверка на связанных пользователей
    или настройка CASCADE на уровне БД.
    """
    db_role = get_role(db, role_id)
    if not db_role:
        return None
    db.delete(db_role)
    db.commit()
    return db_role

# ========================================
# CRUD операции для Статей ДДС (DDS Articles)
# ========================================

def get_dds_article(db: Session, article_id: int, workspace_id: int) -> Optional[models.DdsArticle]:
    """Получает статью ДДС по ID и workspace_id."""
    return db.query(models.DdsArticle).filter(
        models.DdsArticle.id == article_id,
        models.DdsArticle.workspace_id == workspace_id
    ).first()

def get_dds_articles(db: Session, workspace_id: int) -> List[models.DdsArticle]:
    """
    Возвращает иерархический список статей ДДС для заданного рабочего пространства,
    полагаясь на SQLAlchemy relationships.
    """
    all_articles = db.query(models.DdsArticle).filter(models.DdsArticle.workspace_id == workspace_id).options(
        joinedload(models.DdsArticle.children)
    ).order_by(models.DdsArticle.name).all()
    
    # Отфильтровываем только корневые статьи (те, у которых нет родителя)
    root_articles = [article for article in all_articles if article.parent_id is None]

    # Рекурсивная сортировка детей по имени
    def sort_children_recursively(articles_list: List[models.DdsArticle]):
        for article_item in articles_list:
            if article_item.children:
                # Сортируем список дочерних статей
                article_item.children.sort(key=lambda x: x.name)
                # Рекурсивно вызываем для детей
                sort_children_recursively(article_item.children)
    
    sort_children_recursively(root_articles)
    return root_articles

def create_dds_article(db: Session, article: schemas.DdsArticleCreate, workspace_id: int) -> models.DdsArticle:
    """Создает новую статью ДДС."""
    # Проверка существования родительской статьи и её принадлежности тому же workspace
    if article.parent_id:
        parent_article = get_dds_article(db, article.parent_id, workspace_id)
        if not parent_article:
            raise ValueError(f"Родительская статья с ID {article.parent_id} не найдена или не принадлежит вашему рабочему пространству.")
        # Также можно добавить проверку, что родительская статья того же типа (доход/расход)
        if parent_article.article_type != article.article_type:
            raise ValueError("Тип статьи должен совпадать с типом родительской статьи.")

    db_article = models.DdsArticle(
        name=article.name,
        article_type=article.article_type,
        parent_id=article.parent_id,
        is_archived=article.is_archived,
        workspace_id=workspace_id # Устанавливаем workspace_id
    ) 
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return db_article

def update_dds_article(db: Session, article_id: int, article: schemas.DdsArticleUpdate, workspace_id: int) -> Optional[models.DdsArticle]:
    """Обновляет существующую статью ДДС."""
    db_article = get_dds_article(db, article_id=article_id, workspace_id=workspace_id)
    if not db_article:
        return None
    
    update_data = article.dict(exclude_unset=True)
    
    # Проверка, если меняется parent_id
    if "parent_id" in update_data and update_data["parent_id"] is not None:
        parent_article = get_dds_article(db, update_data["parent_id"], workspace_id)
        if not parent_article:
            raise ValueError(f"Новая родительская статья с ID {update_data['parent_id']} не найдена или не принадлежит вашему рабочему пространству.")
        if parent_article.article_type != db_article.article_type:
            raise ValueError("Тип статьи должен совпадать с типом новой родительской статьи.")
    
    for key, value in update_data.items():
        setattr(db_article, key, value)
    
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return db_article

def delete_dds_article(db: Session, article_id: int, workspace_id: int) -> Optional[models.DdsArticle]:
    """
    Удаляет статью ДДС.
    Проверяет наличие связанных транзакций.
    """
    db_article = get_dds_article(db, article_id=article_id, workspace_id=workspace_id)
    if not db_article:
        return None
    
    # Проверка на связанные транзакции
    transaction_count = db.query(models.Transaction).filter(
        models.Transaction.dds_article_id == article_id,
        models.Transaction.workspace_id == workspace_id
    ).count()
    if transaction_count > 0:
        raise ValueError(f"Невозможно удалить статью ДДС ID {article_id}, так как с ней связаны {transaction_count} транзакций.")

    # Если статья имеет дочерние статьи, также необходимо их обработать
    if db_article.children:
        raise ValueError(f"Невозможно удалить статью ДДС ID {article_id}, так как у нее есть дочерние статьи.")
    
    db.delete(db_article)
    db.commit()
    return db_article

# ========================================
# CRUD операции для Счетов (Accounts)
# ========================================

def get_account(db: Session, account_id: int, workspace_id: int) -> Optional[models.Account]:
    """Получает счет по ID и workspace_id."""
    return db.query(models.Account).filter(
        models.Account.id == account_id,
        models.Account.workspace_id == workspace_id
    ).first()

def get_accounts(
    db: Session, 
    workspace_id: int, # Добавлен workspace_id
    skip: int = 0, 
    limit: int = 100, 
    account_ids: Optional[List[int]] = None,
    is_active: Optional[bool] = None
) -> List[models.Account]:
    """Получает список счетов для заданного рабочего пространства."""
    query = db.query(models.Account).filter(models.Account.workspace_id == workspace_id)
    if account_ids:
        query = query.filter(models.Account.id.in_(account_ids))
    if is_active is not None:
        query = query.filter(models.Account.is_active == is_active)
    return query.order_by(models.Account.name).offset(skip).limit(limit).all()

def create_account(db: Session, account: schemas.AccountCreate, workspace_id: int) -> models.Account:
    """Создает новый счет."""
    db_account = models.Account(
        name=account.name,
        account_type=account.account_type,
        currency=account.currency,
        initial_balance=account.initial_balance,
        current_balance=account.initial_balance,
        is_active=account.is_active,
        workspace_id=workspace_id # Устанавливаем workspace_id
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

def update_account(db: Session, account_id: int, account: schemas.AccountUpdate, workspace_id: int) -> Optional[models.Account]:
    """Обновляет существующий счет."""
    db_account = get_account(db, account_id, workspace_id)
    if not db_account:
        return None
    
    update_data = account.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key == 'current_balance': # current_balance должен обновляться только транзакциями
            logger.warning(f"Попытка изменить current_balance для счета ID {account_id} была проигнорирована.")
            continue 
        if key == 'initial_balance' and value is not None and db_account.initial_balance != value :
            logger.warning(f"Попытка изменить initial_balance для счета ID {account_id} была проигнорирована.")
            continue
        setattr(db_account, key, value)
    
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

def delete_account(db: Session, account_id: int, workspace_id: int) -> Optional[models.Account]:
    """
    Удаляет счет.
    Проверяет наличие связанных транзакций.
    """
    db_account = get_account(db, account_id, workspace_id)
    if not db_account:
        return None
    
    # Проверка на связанные транзакции
    transaction_count = db.query(models.Transaction).filter(
        models.Transaction.account_id == account_id,
        models.Transaction.workspace_id == workspace_id
    ).count()
    if transaction_count > 0:
        raise ValueError(f"Невозможно удалить счет ID {account_id}, так как с ним связаны {transaction_count} транзакций.")
    
    db.delete(db_account)
    db.commit()
    return db_account

# ============================================
# CRUD операции для Транзакций (Transactions)
# ============================================

def get_transaction(db: Session, transaction_id: int, workspace_id: int) -> Optional[models.Transaction]:
    """Получает транзакцию по ID и workspace_id с связанными данными."""
    return db.query(models.Transaction).options(
        joinedload(models.Transaction.account),
        joinedload(models.Transaction.dds_article),
        joinedload(models.Transaction.created_by)
    ).filter(
        models.Transaction.id == transaction_id,
        models.Transaction.workspace_id == workspace_id
    ).first()

def get_transactions(
    db: Session, 
    workspace_id: int, # Добавлен workspace_id
    skip: int = 0, 
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    account_id: Optional[int] = None,
    min_amount: Optional[Decimal] = None,
    max_amount: Optional[Decimal] = None,
    dds_article_ids: Optional[List[int]] = None
) -> Tuple[List[models.Transaction], int]: 
    """Получает список транзакций для заданного рабочего пространства с фильтрами."""
    query = db.query(models.Transaction).options(
        joinedload(models.Transaction.account),
        joinedload(models.Transaction.dds_article),
        joinedload(models.Transaction.created_by)
    ).filter(
        models.Transaction.workspace_id == workspace_id # Фильтруем по workspace_id
    )

    if start_date:
        query = query.filter(models.Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(models.Transaction.transaction_date <= end_date)
    if account_id is not None:
        # Убедимся, что счет принадлежит текущему воркспейсу
        account = get_account(db, account_id, workspace_id)
        if not account:
            raise ValueError("Указанный счет не найден или не принадлежит вашему рабочему пространству.")
        query = query.filter(models.Transaction.account_id == account_id)
    if min_amount is not None:
        query = query.filter(models.Transaction.amount >= min_amount)
    if max_amount is not None:
        query = query.filter(models.Transaction.amount <= max_amount)
    if dds_article_ids:
        # Убедимся, что статьи ДДС принадлежат текущему воркспейсу
        actual_articles_count = db.query(models.DdsArticle).filter(
            models.DdsArticle.id.in_(dds_article_ids),
            models.DdsArticle.workspace_id == workspace_id
        ).count()
        if actual_articles_count != len(dds_article_ids):
            raise ValueError("Одна или несколько статей ДДС не найдены или не принадлежат вашему рабочему пространству.")
        query = query.filter(models.Transaction.dds_article_id.in_(dds_article_ids))
    
    total_count = query.count() 
    
    transactions = query.order_by(
        models.Transaction.transaction_date.desc(), 
        models.Transaction.id.desc()
    ).offset(skip).limit(limit).all()
    
    return transactions, total_count

def create_transaction(db: Session, transaction: schemas.TransactionCreate, user_id: int, workspace_id: int) -> models.Transaction:
    """Создает новую транзакцию с обновлением баланса счета."""
    # Проверка, что связанные Account и DdsArticle принадлежат тому же воркспейсу
    account = get_account(db, transaction.account_id, workspace_id)
    if not account:
        raise ValueError("Счет не найден или не принадлежит вашему рабочему пространству.")
    
    dds_article = get_dds_article(db, transaction.dds_article_id, workspace_id)
    if not dds_article:
        raise ValueError("Статья ДДС не найдена или не принадлежит вашему рабочему пространству.")

    db_transaction = models.Transaction(
        transaction_date=transaction.transaction_date,
        amount=transaction.amount, # Храним всегда положительную сумму
        description=transaction.description,
        contractor=transaction.contractor,
        employee=transaction.employee,
        account_id=transaction.account_id,
        dds_article_id=transaction.dds_article_id,
        created_by_user_id=user_id,
        workspace_id=workspace_id # Устанавливаем workspace_id
    )
    
    db.add(db_transaction)
    
    # Обновление баланса счета
    if not _update_account_balance_for_transaction(db, account.id, workspace_id, db_transaction.amount, dds_article.article_type, operation="apply"):
        db.rollback()
        raise ValueError("Не удалось обновить баланс счета при создании транзакции.")

    db.commit() 
    db.refresh(db_transaction)
    db.refresh(account) # Обновляем счет, чтобы получить актуальный баланс
    
    return get_transaction(db, transaction_id=db_transaction.id, workspace_id=workspace_id) # Возвращаем полностью загруженный объект


def update_transaction(
    db: Session, 
    transaction_id: int, 
    transaction_update_data: schemas.TransactionUpdate,
    user_id: int, # Пользователь, вносящий изменения (для аудита, если нужно)
    workspace_id: int # Для фильтрации и проверки
) -> Optional[models.Transaction]:
    """Обновляет транзакцию с корректным пересчетом балансов счетов."""
    
    db_transaction = get_transaction(db, transaction_id=transaction_id, workspace_id=workspace_id)
    if not db_transaction:
        return None

    # 1. Сохраняем старые значения для отката баланса
    old_amount = db_transaction.amount
    old_account_id = db_transaction.account_id
    old_dds_article_id = db_transaction.dds_article_id
    old_article_type = db_transaction.dds_article.article_type # Получаем из загруженной связи

    # Откатываем влияние старой транзакции на баланс старого счета
    if not _update_account_balance_for_transaction(db, old_account_id, workspace_id, old_amount, old_article_type, operation="revert"):
        logger.error(f"Не удалось откатить баланс старого счета {old_account_id} для транзакции {transaction_id}.")
        db.rollback() 
        return None

    # 2. Готовим новые данные
    update_data_dict = transaction_update_data.dict(exclude_unset=True)
    
    new_account_id = update_data_dict.get("account_id", old_account_id)
    new_dds_article_id = update_data_dict.get("dds_article_id", old_dds_article_id)
    new_amount = Decimal(str(update_data_dict.get("amount", old_amount)))

    # Проверка, что новый счет и новая статья ДДС принадлежат тому же воркспейсу
    if new_account_id != old_account_id:
        new_account_obj = get_account(db, new_account_id, workspace_id)
        if not new_account_obj:
            logger.error(f"Новый счет ID {new_account_id} не найден или не принадлежит вашему рабочему пространству.")
            db.rollback()
            raise ValueError(f"Новый счет ID {new_account_id} не найден или не принадлежит вашему рабочему пространству.")
    
    new_article_type = old_article_type
    if new_dds_article_id != old_dds_article_id:
        new_dds_article_obj = get_dds_article(db, new_dds_article_id, workspace_id)
        if not new_dds_article_obj:
            logger.error(f"Новая статья ДДС ID {new_dds_article_id} не найдена или не принадлежит вашему рабочему пространству.")
            db.rollback()
            raise ValueError(f"Новая статья ДДС ID {new_dds_article_id} не найдена или не принадлежит вашему рабочему пространству.")
        new_article_type = new_dds_article_obj.article_type
    else: # Если статья ДДС не меняется, её тип остается прежним
        new_article_type = db_transaction.dds_article.article_type # Берем из текущей транзакции

    # Обновляем поля самой транзакции
    for key, value in update_data_dict.items():
        setattr(db_transaction, key, value)
    
    db_transaction.updated_at = datetime.now(timezone.utc) # Обновляем метку времени

    # 3. Применяем влияние обновленной транзакции на баланс нового (или того же) счета
    if not _update_account_balance_for_transaction(db, new_account_id, workspace_id, new_amount, new_article_type, operation="apply"):
        logger.error(f"Не удалось применить баланс к новому/текущему счету ID {new_account_id} для транзакции {transaction_id}.")
        db.rollback()
        return None
        
    try:
        db.add(db_transaction) # SQLAlchemy отследит изменения
        db.commit()
        db.refresh(db_transaction)
        
        # Явно обновляем связанные счета, чтобы их актуальное состояние было доступно
        old_account_obj = db.query(models.Account).filter(models.Account.id == old_account_id).first()
        if old_account_obj: db.refresh(old_account_obj)
        
        if old_account_id != new_account_id: # Если счет изменился, также обновляем новый счет
            new_account_obj_for_refresh = db.query(models.Account).filter(models.Account.id == new_account_id).first()
            if new_account_obj_for_refresh: db.refresh(new_account_obj_for_refresh)
            
        return get_transaction(db, transaction_id=db_transaction.id, workspace_id=workspace_id)
    except Exception as e:
        db.rollback()
        logger.error(f"Ошибка при сохранении обновленной транзакции {transaction_id}: {e}", exc_info=True)
        raise # Перевыбрасываем исключение, чтобы оно было поймано FastAPI

def delete_transaction(db: Session, transaction_id: int, workspace_id: int) -> Optional[models.Transaction]:
    """Удаляет транзакцию с корректным откатом баланса счета."""
    db_transaction = get_transaction(db, transaction_id=transaction_id, workspace_id=workspace_id)
    if not db_transaction:
        return None

    amount_to_revert = db_transaction.amount
    account_id_to_revert = db_transaction.account_id
    article_type = db_transaction.dds_article.article_type # Получаем тип статьи из загруженной связи

    # Откатываем влияние транзакции на баланс счета
    if not _update_account_balance_for_transaction(db, account_id_to_revert, workspace_id, amount_to_revert, article_type, operation="revert"):
        logger.error(f"Не удалось откатить баланс счета {account_id_to_revert} при удалении транзакции {transaction_id}.")
        db.rollback() 
        return None

    try:
        db.delete(db_transaction)
        db.commit()
        # Обновляем состояние счета, если он был изменен
        account_reverted = db.query(models.Account).filter(models.Account.id == account_id_to_revert).first()
        if account_reverted: db.refresh(account_reverted)
        return db_transaction
    except Exception as e:
        db.rollback()
        logger.error(f"Ошибка при удалении транзакции {transaction_id}: {e}", exc_info=True)
        raise # Перевыбрасываем исключение

# ============================================
# Функции для Отчетов
# ============================================
def get_dds_report_data(
    db: Session, 
    workspace_id: int, # Добавлен workspace_id
    start_date: date, 
    end_date: date, 
    account_ids: Optional[List[int]] = None
) -> schemas.DDSReportData:
    """Генерирует отчет ДДС для заданного рабочего пространства и периода."""
    base_query = db.query(
        models.DdsArticle.id.label("article_id"),
        models.DdsArticle.name.label("article_name"),
        models.DdsArticle.article_type.label("article_type"),
        models.DdsArticle.parent_id.label("article_parent_id"),
        func.sum(models.Transaction.amount).label("total_amount")
    ).join(
        models.DdsArticle, models.Transaction.dds_article_id == models.DdsArticle.id
    ).filter(
        models.Transaction.transaction_date >= start_date,
        models.Transaction.transaction_date <= end_date,
        models.Transaction.workspace_id == workspace_id # Фильтруем по workspace_id
    )

    if account_ids:
        # Проверяем, что счета принадлежат текущему воркспейсу
        actual_accounts_count = db.query(models.Account).filter(
            models.Account.id.in_(account_ids),
            models.Account.workspace_id == workspace_id
        ).count()
        if actual_accounts_count != len(account_ids):
            raise ValueError("Один или несколько счетов не найдены или не принадлежат вашему рабочему пространству.")
        base_query = base_query.filter(models.Transaction.account_id.in_(account_ids))

    aggregated_results = base_query.group_by(
        models.DdsArticle.id,
        models.DdsArticle.name,
        models.DdsArticle.article_type,
        models.DdsArticle.parent_id
    ).order_by(models.DdsArticle.name).all()

    income_items: List[schemas.ReportLineItem] = []
    expense_items: List[schemas.ReportLineItem] = []
    total_income = Decimal(0)
    total_expenses = Decimal(0)

    for row in aggregated_results:
        item_data = {
            "article_id": row.article_id,
            "article_name": row.article_name,
            "article_parent_id": row.article_parent_id,
            "total_amount": row.total_amount if row.total_amount is not None else Decimal(0)
        }
        if row.article_type == 'income':
            income_items.append(schemas.ReportLineItem(**item_data))
            total_income += item_data["total_amount"]
        elif row.article_type == 'expense':
            expense_items.append(schemas.ReportLineItem(**item_data))
            total_expenses += item_data["total_amount"]
    
    net_cash_flow = total_income - total_expenses

    return schemas.DDSReportData(
        start_date=start_date,
        end_date=end_date,
        income_items=income_items,
        total_income=total_income,
        expense_items=expense_items,
        total_expenses=total_expenses,
        net_cash_flow=net_cash_flow
    )

# === Функции для Дашборда ===
def get_dashboard_kpis(db: Session, workspace_id: int) -> schemas.DashboardKPIs:
    """Получает ключевые показатели для дашборда текущего рабочего пространства."""
    # Получаем текущий баланс всех активных счетов в воркспейсе
    total_balance = db.query(func.sum(models.Account.current_balance)).filter(
        models.Account.is_active == True,
        models.Account.workspace_id == workspace_id # Фильтруем по workspace_id
    ).scalar() or Decimal('0.00')

    # Получаем общий доход и расход за последние 30 дней в воркспейсе
    thirty_days_ago = date.today() - timedelta(days=30)
    today = date.today()

    income_query = db.query(func.sum(models.Transaction.amount)).join(models.DdsArticle).filter(
        models.Transaction.transaction_date >= thirty_days_ago,
        models.Transaction.transaction_date <= today,
        models.DdsArticle.article_type == "income",
        models.Transaction.workspace_id == workspace_id # Фильтруем по workspace_id
    )
    total_income_last_30 = income_query.scalar() or Decimal('0.00')

    expense_query = db.query(func.sum(models.Transaction.amount)).join(models.DdsArticle).filter(
        models.Transaction.transaction_date >= thirty_days_ago,
        models.Transaction.transaction_date <= today,
        models.DdsArticle.article_type == "expense",
        models.Transaction.workspace_id == workspace_id # Фильтруем по workspace_id
    )
    total_expenses_last_30 = expense_query.scalar() or Decimal('0.00')

    net_cash_flow_last_30 = total_income_last_30 - total_expenses_last_30

    return schemas.DashboardKPIs(
        total_balances_by_currency={account.currency: account.current_balance for account in get_accounts(db, workspace_id, is_active=True)},
        # Здесь я изменил на получение по валютам, как в старом коде, но с фильтром workspace_id.
        # Твоя исходная функция get_dashboard_kpis не учитывала валюты в total_balance
        # Если тебе нужен просто один общий баланс всех валют - тогда оставь total_balance.
        total_income_last_30_days=total_income_last_30,
        total_expenses_last_30_days=total_expenses_last_30,
        net_cash_flow_last_30_days=net_cash_flow_last_30
    )

def get_cash_flow_trend_data(
    db: Session, 
    workspace_id: int, # Добавлен workspace_id
    start_date: date, 
    end_date: date
) -> schemas.CashFlowTrend:
    """Получает данные тренда денежного потока по дням для заданного рабочего пространства."""
    daily_income_query = db.query(
        models.Transaction.transaction_date.label("date"),
        func.sum(models.Transaction.amount).label("total_income")
    ).join(models.DdsArticle).filter(
        models.DdsArticle.article_type == 'income',
        models.Transaction.transaction_date >= start_date,
        models.Transaction.transaction_date <= end_date,
        models.Transaction.workspace_id == workspace_id # Фильтруем по workspace_id
    ).group_by(models.Transaction.transaction_date).subquery()

    daily_expense_query = db.query(
        models.Transaction.transaction_date.label("date"),
        func.sum(models.Transaction.amount).label("total_expenses")
    ).join(models.DdsArticle).filter(
        models.DdsArticle.article_type == 'expense',
        models.Transaction.transaction_date >= start_date,
        models.Transaction.transaction_date <= end_date,
        models.Transaction.workspace_id == workspace_id # Фильтруем по workspace_id
    ).group_by(models.Transaction.transaction_date).subquery()

    results_by_date: Dict[date, Dict[str, any]] = {}
    current_date_iter = start_date
    while current_date_iter <= end_date:
        results_by_date[current_date_iter] = {"date": current_date_iter, "income": Decimal(0), "expense": Decimal(0)}
        current_date_iter += timedelta(days=1)

    income_data = db.query(daily_income_query.c.date, daily_income_query.c.total_income).all()
    for row_date, total_income_val in income_data:
        results_by_date[row_date]["income"] = total_income_val or Decimal(0)
    
    expense_data = db.query(daily_expense_query.c.date, daily_expense_query.c.total_expenses).all()
    for row_date, total_expenses_val in expense_data:
        results_by_date[row_date]["expense"] = total_expenses_val or Decimal(0)

    daily_flows_list = sorted(
        [schemas.DailyCashFlow(**data) for data in results_by_date.values()],
        key=lambda x: x.date
    )
    
    return schemas.CashFlowTrend(
        start_date=start_date, # Переименовал в schemas на start_date/end_date, если у тебя было period_start_date
        end_date=end_date,
        daily_flows=daily_flows_list
    )


# === ОБРАБОТКА ВЫПИСКИ ТИНЬКОФФ ===
def parse_tinkoff_amount(amount_str: str) -> Decimal:
    """Парсит строку суммы из Тинькофф CSV в Decimal."""
    return Decimal(amount_str.replace(',', '.'))

def find_dds_article_by_keywords(
    description: str, 
    operation_type_for_map: str, 
    default_article_id: int, 
    db: Session, # Передаем сессию БД для проверки статьи на принадлежность workspace
    workspace_id: int # И workspace_id
) -> int:
    """
    Пытается найти статью ДДС по ключевым словам в описании.
    Возвращает ID найденной статьи или ID статьи по умолчанию.
    """
    if not description or not KEYWORD_TO_DDS_ARTICLE_MAP_FROM_FILE:
        return default_article_id
        
    description_lower = description.lower()
    rules = KEYWORD_TO_DDS_ARTICLE_MAP_FROM_FILE.get(operation_type_for_map, [])
    
    for rule in rules:
        if "keywords" not in rule or "article_id" not in rule:
            continue 
        for keyword in rule["keywords"]:
            if keyword.lower() in description_lower:
                try:
                    matched_article_id = int(rule["article_id"])
                    # Дополнительно убедимся, что найденная статья принадлежит текущему воркспейсу
                    if db.query(models.DdsArticle).filter(
                        models.DdsArticle.id == matched_article_id, 
                        models.DdsArticle.workspace_id == workspace_id
                    ).first():
                        return matched_article_id
                    else:
                        logger.warning(f"Правило найдено, но статья ID {matched_article_id} не принадлежит рабочему пространству {workspace_id}. Использование статьи по умолчанию.")
                        break # Пробуем следующее правило, если это было некорректным
                except ValueError:
                    logger.error(f"Неверный article_id в правиле: {rule['article_id']}. Пропускаю это правило.")
                    continue # Пробуем следующее правило
    
    return default_article_id

def process_tinkoff_statement(
    db: Session, 
    csv_data_str: str, 
    account_id: int, 
    default_income_article_id: int,
    default_expense_article_id: int,
    created_by_user_id: int,
    workspace_id: int # Добавлен workspace_id
) -> Dict[str, any]:
    """Обрабатывает CSV файл выписки Тинькофф, создает транзакции."""
    
    created_count = 0
    failed_rows = 0
    skipped_duplicates_count = 0
    created_transactions_auto = 0
    transactions_for_review = [] # Для транзакций, требующих ручной проверки

    # Проверка принадлежности счета и статей ДДС к воркспейсу
    # Эти проверки дублируются из main.py, но лучше иметь их и здесь для надежности
    # или можно полагаться только на validate_workspace_ownership_for_ids в main.py
    account = get_account(db, account_id, workspace_id)
    if not account:
        raise ValueError("Счет не найден или не принадлежит вашему рабочему пространству.")
    
    default_income_article = get_dds_article(db, default_income_article_id, workspace_id)
    if not default_income_article:
        raise ValueError("Статья дохода по умолчанию не найдена или не принадлежит вашему рабочему пространству.")

    default_expense_article = get_dds_article(db, default_expense_article_id, workspace_id)
    if not default_expense_article:
        raise ValueError("Статья расхода по умолчанию не найдена или не принадлежит вашему рабочему пространству.")

    csv_file = io.StringIO(csv_data_str)
    reader = csv.reader(csv_file, delimiter=';') 

    # Пропускаем заголовки (первые 2 строки для Тинькофф выписки)
    try:
        next(reader) 
        next(reader) 
    except StopIteration:
        logger.warning("Файл выписки слишком короткий или пустой (не содержит данных после заголовков).")
        return {
            "created_count": 0, "failed_rows": 0, "skipped_duplicates_count": 0,
            "created_transactions_auto": 0, "transactions_for_review": []
        }

    for row_index, row in enumerate(reader):
        current_file_row_num = row_index + 3 # Для более точного номера строки в логах (т.к. 2 заголовка пропущены)
        
        if not row or len(row) < 9: # Минимальное количество колонок для базовой информации
            logger.warning(f"Пропущена строка {current_file_row_num}: Недостаточно колонок или пустая строка.")
            failed_rows += 1
            continue

        try:
            operation_type_str = row[1].strip() # "Кредит" / "Дебет"
            operation_date_str = row[2].strip() # Дата операции
            amount_str = row[5].strip() # Сумма операции
            description_payment = row[8].strip() # Описание операции (для поиска по ключевым словам)
            
            # Контрагент может быть в разных колонках в зависимости от типа операции или версии выписки
            counterparty_name = ""
            if operation_type_str == "Кредит" and len(row) > 12 and row[12].strip():
                counterparty_name = row[12].strip()
            elif operation_type_str == "Дебет" and len(row) > 18 and row[18].strip():
                counterparty_name = row[18].strip()
            # Дополнительная проверка на 21 колонку, если там может быть контрагент
            if not counterparty_name and len(row) > 21 and row[21].strip():
                counterparty_name = row[21].strip()

            transaction_date = datetime.strptime(operation_date_str, "%d.%m.%Y").date()
            amount_decimal = parse_tinkoff_amount(amount_str)

            if amount_decimal == Decimal(0): # Пропускаем нулевые транзакции
                continue

            op_type_for_map = None
            is_income_operation = False

            if operation_type_str == "Кредит": # Приход
                op_type_for_map = 'income'
                is_income_operation = True
                dds_article_id_to_use = find_dds_article_by_keywords(description_payment, op_type_for_map, default_income_article_id, db, workspace_id)
            elif operation_type_str == "Дебет": # Расход
                op_type_for_map = 'expense'
                is_income_operation = False
                dds_article_id_to_use = find_dds_article_by_keywords(description_payment, op_type_for_map, default_expense_article_id, db, workspace_id)
            else:
                logger.warning(f"Неизвестный тип операции '{operation_type_str}' в строке {current_file_row_num}. Строка пропущена.")
                failed_rows += 1
                continue
            
            # Если find_dds_article_by_keywords вернул 0, это означает "пропустить" транзакцию
            if dds_article_id_to_use == 0: 
                logger.info(f"Транзакция в строке {current_file_row_num} пропущена по правилу 'пропустить'. Описание: '{description_payment[:50]}...'")
                continue 
            
            # Проверка на дубликаты
            existing_transaction_query = db.query(models.Transaction).filter(
                models.Transaction.account_id == account_id,
                models.Transaction.transaction_date == transaction_date,
                models.Transaction.amount == abs(amount_decimal), # Сравниваем с абсолютным значением
                models.Transaction.description == description_payment,
                models.Transaction.workspace_id == workspace_id # Важно: фильтруем и по workspace_id
            )
            
            # Улучшенная проверка дубликатов: проверяем также тип статьи и контрагента
            is_duplicate = False
            for pot_dup in existing_transaction_query.all():
                # Проверяем, что статья ДДС совпадает по типу (доход/расход)
                # или если она известна, то совпадает по ID
                pot_dup_article = get_dds_article(db, pot_dup.dds_article_id, workspace_id)
                if pot_dup_article and pot_dup_article.article_type == op_type_for_map:
                    if (pot_dup.contractor or '') == (counterparty_name or ''): # Сравниваем контрагента
                        is_duplicate = True
                        break
            if is_duplicate:
                skipped_duplicates_count += 1
                continue
            
            transaction_data = schemas.TransactionCreate(
                transaction_date=transaction_date,
                amount=abs(amount_decimal), # Убедимся, что сумма положительная
                description=description_payment,
                contractor=counterparty_name or None,
                employee=None, # Тинькофф выписки обычно не содержат поля сотрудника
                account_id=account_id,
                dds_article_id=dds_article_id_to_use
            )

            # Сохранение транзакции
            # Если статья была назначена автоматически, создаем сразу
            if dds_article_id_to_use == default_income_article_id or dds_article_id_to_use == default_expense_article_id:
                # Транзакция будет сохранена с дефолтной категорией, если не было авто-матча
                db_transaction = create_transaction(
                    db=db,
                    transaction=transaction_data,
                    user_id=created_by_user_id,
                    workspace_id=workspace_id
                )
                if db_transaction:
                    created_transactions_auto += 1
                else:
                    failed_rows +=1 # Если create_transaction вернул None (хотя он должен выбросить исключение)
            else:
                # Если найдена статья по ключевым словам (не дефолтная), создаем сразу
                db_transaction = create_transaction(
                    db=db,
                    transaction=transaction_data,
                    user_id=created_by_user_id,
                    workspace_id=workspace_id
                )
                if db_transaction:
                    created_transactions_auto += 1 # Считаем все автоматически созданные транзакции
                else:
                    failed_rows +=1 # Если create_transaction вернул None
                
            # Если ты хочешь разделить на "автоматически созданные" и "требующие ручной проверки",
            # тогда логика должна быть более сложной:
            # 1. Сначала пытаемся найти статью.
            # 2. Если статья найдена НЕ дефолтная, то это 'created_transactions_auto'.
            # 3. Если статья найдена ДЕФОЛТНАЯ, то это 'transactions_for_review'.
            # В текущей реализации, если статья найдена по ключевым словам или это дефолтная,
            # она сразу создается. Те, что попадают в transactions_for_review,
            # это те, для которых не было автоматического матча и они не дефолтные.
            
            # В данный момент, если dds_article_id_to_use НЕ 0, транзакция создается.
            # Если ты хочешь, чтобы "transactions_for_review" включал транзакции с дефолтной категорией,
            # тогда тебе нужно добавить их в список transactions_for_review.
            # Сейчас logic assumes that if a default article is used, it's auto-created.
            
        except (ValueError, InvalidOperation, IndexError) as e:
            logger.error(f"Ошибка парсинга или данных в строке {current_file_row_num}: {e}. Данные строки (частично): {row[:9]}")
            failed_rows += 1
        except Exception as e: 
            logger.error(f"Неожиданная ошибка при обработке строки {current_file_row_num}: {e}. Данные строки (частично): {row[:9]}", exc_info=True)
            failed_rows += 1
            
    final_result = {
        "created_count": created_transactions_auto, # Количество автоматически созданных и сопоставленных транзакций
        "failed_rows": failed_rows,
        "skipped_duplicates_count": skipped_duplicates_count,
        "created_transactions_auto": created_transactions_auto, # Дублирование для ясности, если понадобится в схеме
        "transactions_for_review": transactions_for_review # Пока пустой, если не используется отдельная логика для него
    }
    logger.info(f"Завершение обработки выписки: {final_result}")
    return final_result


# --- Вспомогательная функция для проверки принадлежности ID к рабочему пространству ---
def validate_workspace_ownership_for_ids(
    db: Session,
    workspace_id: int,
    account_ids: Optional[List[int]] = None,
    dds_article_ids: Optional[List[int]] = None
):
    """
    Проверяет, что все переданные ID счетов и статей ДДС принадлежат
    заданному рабочему пространству.
    Возбуждает ValueError, если какой-либо ID не найден или не принадлежит.
    """
    if account_ids:
        # Получаем количество счетов, которые действительно принадлежат workspace
        actual_accounts_count = db.query(models.Account).filter(
            models.Account.id.in_(account_ids),
            models.Account.workspace_id == workspace_id
        ).count()
        if actual_accounts_count != len(account_ids):
            raise ValueError("Один или несколько ID счетов не найдены или не принадлежат вашему рабочему пространству.")
    
    if dds_article_ids:
        # Получаем количество статей ДДС, которые действительно принадлежат workspace
        actual_articles_count = db.query(models.DdsArticle).filter(
            models.DdsArticle.id.in_(dds_article_ids),
            models.DdsArticle.workspace_id == workspace_id
        ).count()
        if actual_articles_count != len(dds_article_ids):
            raise ValueError("Один или несколько ID статей ДДС не найдены или не принадлежат вашему рабочему пространству.")