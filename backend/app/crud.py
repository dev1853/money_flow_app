# app/crud.py
import csv
import io
import json
import os
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional, Dict, Tuple
from datetime import date, timedelta, datetime
from decimal import Decimal, InvalidOperation 

from . import models, schemas
from . import auth_utils

# --- Вспомогательная функция для обновления баланса ---
def _update_account_balance_for_transaction(db: Session, account_id: int, amount: Decimal, article_type: str, operation: str = "apply"):
    """
    Обновляет баланс счета.
    operation: "apply" (применить транзакцию) или "revert" (откатить транзакцию)
    """
    account_to_update = db.query(models.Account).filter(models.Account.id == account_id).first()
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
        db.add(account_to_update)
        # db.commit() здесь не делаем, коммит будет общий для всей операции
        # db.refresh(account_to_update) тоже после общего коммита
        return True
    return False

# --- Загрузка правил сопоставления ключевых слов для статей ДДС ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RULES_FILE_PATH = os.path.join(os.path.dirname(BASE_DIR), "dds_keyword_mapping_rules.json")

KEYWORD_TO_DDS_ARTICLE_MAP_FROM_FILE = {}
try:
    with open(RULES_FILE_PATH, 'r', encoding='utf-8') as f:
        KEYWORD_TO_DDS_ARTICLE_MAP_FROM_FILE = json.load(f)
    print(f"INFO CRUD: Правила сопоставления ключевых слов успешно загружены из {RULES_FILE_PATH}")
except FileNotFoundError:
    print(f"ПРЕДУПРЕЖДЕНИЕ CRUD: Файл правил {RULES_FILE_PATH} не найден. Автоматическое определение статей по ключевым словам не будет работать, будут использоваться статьи по умолчанию.")
except json.JSONDecodeError as e:
    print(f"ОШИБКА CRUD: Не удалось декодировать JSON из файла правил {RULES_FILE_PATH}: {e}")
except Exception as e:
    print(f"ОШИБКА CRUD: Непредвиденная ошибка при загрузке правил из {RULES_FILE_PATH}: {e}")

# ==================================
# CRUD операции для Пользователей (Users)
# ==================================

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    return db.query(models.User).filter(models.User.is_active == True).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    hashed_password = auth_utils.get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        password_hash=hashed_password,
        role_id=user.role_id,
        is_active=user.is_active
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_by_admin(db: Session, user_id: int, user_update: schemas.UserUpdateAdmin) -> Optional[models.User]:
    db_user = get_user(db, user_id=user_id)
    if not db_user:
        return None

    update_data = user_update.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int) -> Optional[models.User]:
    db_user = get_user(db, user_id=user_id)
    if db_user:
        # ВАЖНО: Что делать с транзакциями этого пользователя?
        # Вариант 1: Запретить удаление, если есть транзакции (предпочтительнее)
        # transaction_count = db.query(models.Transaction).filter(models.Transaction.created_by_user_id == user_id).count()
        # if transaction_count > 0:
        #     return None # Сигнализируем, что удаление не выполнено (или возбуждаем HTTPException в main.py)

        # Вариант 2: Установить created_by_user_id в NULL для его транзакций (если модель позволяет nullable)
        # db.query(models.Transaction).filter(models.Transaction.created_by_user_id == user_id).update({"created_by_user_id": None})
        
        # Вариант 3 (текущий, простой): Простое удаление. Может вызвать ошибку FK, если есть связанные транзакции и FK не настроен на ON DELETE SET NULL/CASCADE
        # Либо, если нет FK constraint на created_by_user_id (что не очень хорошо)
        
        # Пока что будем деактивировать пользователя вместо удаления, это безопаснее.
        # Для реального удаления нужно выбрать стратегию.
        # Если все же нужно удаление:
        # db.delete(db_user)
        # db.commit()
        # return db_user # Возвращаем "удаленного" пользователя
        
        # БОЛЕЕ БЕЗОПАСНЫЙ ВАРИАНТ - ДЕАКТИВАЦИЯ (если удаление не требуется немедленно)
        db_user.is_active = False
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        print(f"Пользователь ID {user_id} деактивирован вместо удаления.")
        return db_user # Возвращаем деактивированного пользователя
    return None

# ==================================
# CRUD операции для Ролей (Roles)
# ==================================

def get_role(db: Session, role_id: int) -> Optional[models.Role]:
     return db.query(models.Role).filter(models.Role.id == role_id).first()

def get_role_by_name(db: Session, name: str) -> Optional[models.Role]:
    return db.query(models.Role).filter(models.Role.name == name).first()

def get_roles(db: Session, skip: int = 0, limit: int = 100) -> List[models.Role]:
    return db.query(models.Role).offset(skip).limit(limit).all()

def create_role(db: Session, role: schemas.RoleCreate) -> models.Role:
    db_role = models.Role(
        name=role.name, 
        description=role.description,
        permissions=role.permissions or {} # Сохраняем permissions
    )
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

def update_role(db: Session, role_id: int, role_update: schemas.RoleUpdate) -> Optional[models.Role]:
    db_role = get_role(db, role_id=role_id)
    if not db_role:
        return None
    
    update_data = role_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        # Проверяем, что setattr не пытается установить None, если поле не было передано
        # exclude_unset=True уже должен это делать, но для надежности:
        if value is not None or key in role_update.model_fields_set: # model_fields_set для Pydantic V2, в V1 это __fields_set__
                                                                   # или просто if key in update_data: (т.к. exclude_unset уже применен)
            setattr(db_role, key, value)
    
    db.add(db_role) # SQLAlchemy отследит изменения, но явное add не повредит
    db.commit()
    db.refresh(db_role)
    return db_role

def delete_role(db: Session, role_id: int) -> Optional[models.Role]:
    db_role = get_role(db, role_id)
    if not db_role:
        return None
    # TODO: Проверить, не используются ли роли пользователями перед удалением
    # или запретить удаление базовых ролей (admin, employee)
    db.delete(db_role)
    db.commit()
    return db_role # Возвращаем удаленный объект для информации

# ========================================
# CRUD операции для Статей ДДС (DDS Articles)
# ========================================

def get_dds_article(db: Session, article_id: int) -> Optional[models.DdsArticle]:
    return db.query(models.DdsArticle).filter(models.DdsArticle.id == article_id).first()

def get_dds_articles(db: Session) -> List[models.DdsArticle]:
    """
    Возвращает иерархический список статей ДДС, полагаясь на SQLAlchemy relationships.
    """
    # Загружаем все статьи. SQLAlchemy должен сам корректно обработать self-referential relationship.
    # joinedload('children') может быть полезен, если вы хотите гарантировать загрузку первого уровня детей.
    # Для полной рекурсивной загрузки SQLAlchemy и Pydantic (с orm_mode=True и update_forward_refs)
    # должны справиться, когда FastAPI будет сериализовать ответ.
    
    # Вариант 1: Просто загрузить все и отфильтровать корневые
    all_articles = db.query(models.DdsArticle).options(
        joinedload(models.DdsArticle.children) # Загружаем детей первого уровня
    ).order_by(models.DdsArticle.name).all()
    
    root_articles = [article for article in all_articles if article.parent_id is None]

    # Если нужна сортировка детей на всех уровнях, это можно сделать 
    # либо через order_by в relationship в модели, либо рекурсивно здесь, либо на фронте.
    # Пример рекурсивной сортировки (если order_by в relationship не сработал для всех уровней):
    def sort_children_recursively(articles_list):
        for article_item in articles_list:
            if article_item.children:
                article_item.children.sort(key=lambda x: x.name)
                sort_children_recursively(article_item.children)
    
    sort_children_recursively(root_articles) # Сортируем детей у корневых и их потомков

    return root_articles

def create_dds_article(db: Session, article: schemas.DdsArticleCreate) -> models.DdsArticle:
    db_article = models.DdsArticle(**article.dict()) 
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return db_article

def update_dds_article(db: Session, article_id: int, article: schemas.DdsArticleUpdate) -> Optional[models.DdsArticle]:
    db_article = get_dds_article(db, article_id=article_id)
    if db_article:
        update_data = article.dict(exclude_unset=True) 
        for key, value in update_data.items():
            setattr(db_article, key, value)
        db.commit()
        db.refresh(db_article)
    return db_article

def delete_dds_article(db: Session, article_id: int) -> Optional[models.DdsArticle]:
    db_article = get_dds_article(db, article_id=article_id)
    if db_article:
        # TODO: (ТЗ 2.1.2) Добавить проверку на связанные операции перед удалением.
        db.delete(db_article)
        db.commit()
    return db_article

# ========================================
# CRUD операции для Счетов (Accounts)
# ========================================

def get_account(db: Session, account_id: int) -> Optional[models.Account]:
    return db.query(models.Account).filter(models.Account.id == account_id).first()

def get_accounts(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    account_ids: Optional[List[int]] = None,
    is_active: Optional[bool] = None
) -> List[models.Account]:
    query = db.query(models.Account)
    if account_ids:
        query = query.filter(models.Account.id.in_(account_ids))
    if is_active is not None:
        query = query.filter(models.Account.is_active == is_active)
    return query.order_by(models.Account.name).offset(skip).limit(limit).all()

def create_account(db: Session, account: schemas.AccountCreate) -> models.Account:
    db_account = models.Account(
        name=account.name,
        account_type=account.account_type,
        currency=account.currency,
        initial_balance=account.initial_balance,
        current_balance=account.initial_balance,
        is_active=account.is_active 
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

def update_account(db: Session, account_id: int, account: schemas.AccountUpdate) -> Optional[models.Account]:
    db_account = get_account(db, account_id)
    if db_account:
        update_data = account.dict(exclude_unset=True)
        for key, value in update_data.items():
            if key == 'current_balance':
                continue 
            if key == 'initial_balance' and value is not None and db_account.initial_balance != value :
                print(f"Предупреждение CRUD: Попытка изменить initial_balance для счета ID {account_id} была проигнорирована.")
                continue
            if value is not None:
                 setattr(db_account, key, value)
        db.commit()
        db.refresh(db_account)
    return db_account

def delete_account(db: Session, account_id: int) -> Optional[models.Account]:
    db_account = get_account(db, account_id)
    if db_account:
        # TODO: Добавить проверку на связанные транзакции. 
        db.delete(db_account)
        db.commit()
    return db_account

# ============================================
# CRUD операции для Транзакций (Transactions)
# ============================================

def get_transaction(db: Session, transaction_id: int) -> Optional[models.Transaction]:
    return db.query(models.Transaction).options(
        joinedload(models.Transaction.account),
        joinedload(models.Transaction.dds_article),
        joinedload(models.Transaction.created_by)
    ).filter(models.Transaction.id == transaction_id).first()

def get_transactions(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    account_id: Optional[int] = None,
    min_amount: Optional[Decimal] = None,
    max_amount: Optional[Decimal] = None,
    dds_article_ids: Optional[List[int]] = None
) -> Tuple[List[models.Transaction], int]: 
    
    query = db.query(models.Transaction).options(
        joinedload(models.Transaction.account),
        joinedload(models.Transaction.dds_article),
        joinedload(models.Transaction.created_by)
    )

    # Применяем фильтры (как и раньше)
    if start_date:
        query = query.filter(models.Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(models.Transaction.transaction_date <= end_date)
    if account_id is not None:
        query = query.filter(models.Transaction.account_id == account_id)
    if min_amount is not None:
        query = query.filter(models.Transaction.amount >= min_amount)
    if max_amount is not None:
        query = query.filter(models.Transaction.amount <= max_amount)
    if dds_article_ids:
        query = query.filter(models.Transaction.dds_article_id.in_(dds_article_ids))
    
    # Сначала получаем общее количество записей, соответствующих фильтрам (ДО применения skip/limit)
    total_count = query.count() 
    
    # Затем применяем сортировку, skip и limit для выборки текущей страницы
    transactions = query.order_by(
        models.Transaction.transaction_date.desc(), 
        models.Transaction.id.desc()
    ).offset(skip).limit(limit).all()
    
    return transactions, total_count

def create_transaction(db: Session, transaction: schemas.TransactionCreate, user_id: int) -> models.Transaction:
    db_transaction_data = transaction.dict() 
    db_transaction_data['created_by_user_id'] = user_id 
                                    
    db_transaction = models.Transaction(**db_transaction_data)
    
    db.add(db_transaction)
    # db.flush() # Не обязательно здесь, если нет зависимых вычислений до commit, требующих ID

    dds_article = db.query(models.DdsArticle).filter(models.DdsArticle.id == db_transaction.dds_article_id).first()
    account_to_update = db.query(models.Account).filter(models.Account.id == db_transaction.account_id).first()

    if account_to_update and dds_article:
        if dds_article.article_type == 'income':
            account_to_update.current_balance += db_transaction.amount
        elif dds_article.article_type == 'expense':
            account_to_update.current_balance -= db_transaction.amount
        db.add(account_to_update)
    else:
        print(f"КРИТИЧЕСКАЯ ОШИБКА CRUD: Не найден счет ({db_transaction.account_id}) или статья ДДС ({db_transaction.dds_article_id}) для обновления баланса при создании транзакции.")
        # ВАРИАНТ: db.rollback(); raise HTTPException(status_code=400, detail="Invalid account or DDS article for transaction")

    db.commit() 
    db.refresh(db_transaction)
    if account_to_update:
        db.refresh(account_to_update)
    
    return get_transaction(db, transaction_id=db_transaction.id)


def update_transaction_details(
    db: Session, 
    transaction_id: int, 
    transaction_update: schemas.TransactionCategoryUpdate
) -> Optional[models.Transaction]:
    db_transaction = get_transaction(db, transaction_id=transaction_id)
    
    if not db_transaction:
        return None

    new_article = get_dds_article(db, article_id=transaction_update.dds_article_id)
    if not new_article:
        print(f"ПРЕДУПРЕЖДЕНИЕ CRUD: Попытка обновить транзакцию ID {transaction_id} на несуществующую статью ДДС ID {transaction_update.dds_article_id}")
        return None 

    db_transaction.dds_article_id = transaction_update.dds_article_id
    
    if transaction_update.description is not None:
        db_transaction.description = transaction_update.description
    
    if transaction_update.contractor is not None:
        db_transaction.contractor = transaction_update.contractor
    
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    
    return get_transaction(db, transaction_id=db_transaction.id)

# TODO: Добавить полноценные update_transaction и delete_transaction с логикой пересчета/сторнирования балансов.

# --- ПОЛНОЦЕННОЕ ОБНОВЛЕНИЕ ТРАНЗАКЦИИ ---
def update_transaction(
    db: Session, 
    transaction_id: int, 
    transaction_update_data: schemas.TransactionUpdate,
    user_id: int # Пользователь, вносящий изменения (для аудита, если нужно)
) -> Optional[models.Transaction]:
    
    db_transaction = get_transaction(db, transaction_id=transaction_id) # Эта функция уже делает joinedload
    if not db_transaction:
        return None

    # 1. Сохраняем старые значения для отката баланса
    old_amount = db_transaction.amount
    old_account_id = db_transaction.account_id
    old_dds_article_id = db_transaction.dds_article_id
    old_article = db_transaction.dds_article # Загружен через get_transaction
    
    if not old_article: # На всякий случай, если статья была удалена или связь нарушена
        print(f"КРИТИЧЕСКАЯ ОШИБКА: Не найдена старая статья ДДС ID {old_dds_article_id} для транзакции ID {transaction_id}")
        # Здесь нужно решить, как обрабатывать - возможно, запретить обновление или использовать какой-то тип по умолчанию
        return None # Или raise Exception

    old_article_type = old_article.article_type

    # 2. Готовим новые данные
    update_data_dict = transaction_update_data.dict(exclude_unset=True)
    
    new_account_id = update_data_dict.get("account_id", old_account_id)
    new_dds_article_id = update_data_dict.get("dds_article_id", old_dds_article_id)
    new_amount = Decimal(str(update_data_dict.get("amount", old_amount))) # Приводим к Decimal, если передано

    # Получаем новый тип статьи, если статья меняется
    new_article_type = old_article_type
    if "dds_article_id" in update_data_dict and update_data_dict["dds_article_id"] != old_dds_article_id:
        new_article = get_dds_article(db, article_id=new_dds_article_id)
        if not new_article:
            # raise HTTPException(status_code=400, detail=f"Новая статья ДДС ID {new_dds_article_id} не найдена.")
            print(f"ПРЕДУПРЕЖДЕНИЕ: Новая статья ДДС ID {new_dds_article_id} не найдена при обновлении транзакции ID {transaction_id}")
            return None # Прерываем обновление
        new_article_type = new_article.article_type
    elif "dds_article_id" not in update_data_dict: # Статья не меняется, тип остается прежним
        new_article_type = old_article_type
    else: # Статья меняется на ту же самую, тип прежний
        new_article_type = old_article_type


    # 3. Откатываем влияние старой транзакции на баланс старого счета
    if not _update_account_balance_for_transaction(db, old_account_id, old_amount, old_article_type, operation="revert"):
        print(f"КРИТИЧЕСКАЯ ОШИБКА: Не найден старый счет ID {old_account_id} для отката баланса транзакции ID {transaction_id}")
        db.rollback() # Откатываем изменения, если не можем обновить баланс
        return None

    # 4. Обновляем поля самой транзакции
    for key, value in update_data_dict.items():
        setattr(db_transaction, key, value)
    # db_transaction.updated_at = datetime.now(timezone.utc) # Если у вас есть поле updated_at и оно не onupdate=func.now()

    # 5. Применяем влияние обновленной транзакции на баланс нового (или того же) счета
    if not _update_account_balance_for_transaction(db, new_account_id, new_amount, new_article_type, operation="apply"):
        print(f"КРИТИЧЕСКАЯ ОШИБКА: Не найден новый/текущий счет ID {new_account_id} для применения баланса транзакции ID {transaction_id}")
        db.rollback() # Откатываем изменения
        return None
        
    try:
        db.add(db_transaction) # SQLAlchemy отследит изменения
        db.commit()
        db.refresh(db_transaction)
        # Обновляем связанные счета, если они изменились или их баланс изменился
        if old_account_id != new_account_id:
            old_account = get_account(db, old_account_id)
            if old_account: db.refresh(old_account)
        
        current_account = get_account(db, new_account_id) # Это тот же account_to_update из _update_account_balance_for_transaction
        if current_account: db.refresh(current_account)
            
        return get_transaction(db, transaction_id=db_transaction.id) # Возвращаем полностью загруженный объект
    except Exception as e:
        db.rollback()
        print(f"ОШИБКА CRUD при сохранении обновленной транзакции: {e}")
        return None


# --- УДАЛЕНИЕ ТРАНЗАКЦИИ ---
def delete_transaction(db: Session, transaction_id: int) -> Optional[models.Transaction]:
    db_transaction = get_transaction(db, transaction_id=transaction_id) # Эта функция уже делает joinedload
    if not db_transaction:
        return None

    amount_to_revert = db_transaction.amount
    account_id_to_revert = db_transaction.account_id
    article = db_transaction.dds_article # dds_article должен быть загружен через get_transaction

    if not article:
        print(f"КРИТИЧЕСКАЯ ОШИБКА: Не найдена статья ДДС для транзакции ID {transaction_id} при удалении.")
        # Решаем, что делать - возможно, удалять транзакцию без изменения баланса или запрещать
        db.delete(db_transaction) # Удаляем транзакцию, но баланс может остаться некорректным
        db.commit()
        return db_transaction # Возвращаем "как есть" удаленную
    
    article_type = article.article_type

    # Откатываем влияние транзакции на баланс счета
    if not _update_account_balance_for_transaction(db, account_id_to_revert, amount_to_revert, article_type, operation="revert"):
        print(f"КРИТИЧЕСКАЯ ОШИБКА: Не найден счет ID {account_id_to_revert} для отката баланса при удалении транзакции ID {transaction_id}")
        db.rollback() # Откатываем, если не можем обновить баланс
        return None # Сигнализируем об ошибке

    try:
        db.delete(db_transaction)
        db.commit()
        # Обновляем состояние счета, если он был изменен
        account_reverted = get_account(db, account_id_to_revert)
        if account_reverted: db.refresh(account_reverted)
        return db_transaction # Возвращаем удаленный объект (он еще доступен до конца сессии)
    except Exception as e:
        db.rollback()
        print(f"ОШИБКА CRUD при удалении транзакции: {e}")
        return None

# ============================================
# Функции для Отчетов
# ============================================
def get_dds_report_data(
    db: Session, 
    start_date: date, 
    end_date: date, 
    account_ids: Optional[List[int]] = None
) -> schemas.DDSReportData:
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
        models.Transaction.transaction_date <= end_date
    )

    if account_ids:
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
def get_dashboard_kpis(db: Session) -> schemas.DashboardKPIs:
    balance_results = db.query(
        models.Account.currency,
        func.sum(models.Account.current_balance).label("total_current_balance")
    ).filter(models.Account.is_active == True).group_by(models.Account.currency).all()
    
    total_balances = {row.currency: row.total_current_balance if row.total_current_balance is not None else Decimal(0) for row in balance_results}

    thirty_days_ago = date.today() - timedelta(days=30)
    today = date.today()

    income_sum_result = db.query(func.sum(models.Transaction.amount).label("total")) \
        .join(models.DdsArticle) \
        .filter(models.DdsArticle.article_type == 'income') \
        .filter(models.Transaction.transaction_date >= thirty_days_ago) \
        .filter(models.Transaction.transaction_date <= today) \
        .scalar()
    total_income_last_30 = income_sum_result or Decimal(0)

    expense_sum_result = db.query(func.sum(models.Transaction.amount).label("total")) \
        .join(models.DdsArticle) \
        .filter(models.DdsArticle.article_type == 'expense') \
        .filter(models.Transaction.transaction_date >= thirty_days_ago) \
        .filter(models.Transaction.transaction_date <= today) \
        .scalar()
    total_expenses_last_30 = expense_sum_result or Decimal(0)

    net_cash_flow_last_30 = total_income_last_30 - total_expenses_last_30

    return schemas.DashboardKPIs(
        total_balances_by_currency=total_balances,
        total_income_last_30_days=total_income_last_30,
        total_expenses_last_30_days=total_expenses_last_30,
        net_cash_flow_last_30_days=net_cash_flow_last_30
    )

def get_cash_flow_trend_data(db: Session, start_date: date, end_date: date) -> schemas.CashFlowTrend:
    daily_income_query = db.query(
        models.Transaction.transaction_date.label("date"),
        func.sum(models.Transaction.amount).label("total_income")
    ).join(models.DdsArticle).filter(
        models.DdsArticle.article_type == 'income',
        models.Transaction.transaction_date >= start_date,
        models.Transaction.transaction_date <= end_date
    ).group_by(models.Transaction.transaction_date).subquery()

    daily_expense_query = db.query(
        models.Transaction.transaction_date.label("date"),
        func.sum(models.Transaction.amount).label("total_expenses")
    ).join(models.DdsArticle).filter(
        models.DdsArticle.article_type == 'expense',
        models.Transaction.transaction_date >= start_date,
        models.Transaction.transaction_date <= end_date
    ).group_by(models.Transaction.transaction_date).subquery()

    results_by_date: Dict[date, Dict[str, any]] = {} # Уточнил тип для results_by_date
    current_date_iter = start_date
    while current_date_iter <= end_date:
        results_by_date[current_date_iter] = {"date": current_date_iter, "total_income": Decimal(0), "total_expenses": Decimal(0)}
        current_date_iter += timedelta(days=1)

    income_data = db.query(daily_income_query.c.date, daily_income_query.c.total_income).all()
    for row_date, total_income_val in income_data:
        if row_date in results_by_date: # Проверка на случай, если дата из запроса вне диапазона (хотя фильтр должен это исключать)
            results_by_date[row_date]["total_income"] = total_income_val or Decimal(0)
    
    expense_data = db.query(daily_expense_query.c.date, daily_expense_query.c.total_expenses).all()
    for row_date, total_expenses_val in expense_data:
        if row_date in results_by_date:
            results_by_date[row_date]["total_expenses"] = total_expenses_val or Decimal(0)

    daily_flows_list = sorted(
        [schemas.DailyCashFlow(**data) for data in results_by_date.values()],
        key=lambda x: x.date
    )
    
    return schemas.CashFlowTrend(
        period_start_date=start_date,
        period_end_date=end_date,
        daily_flows=daily_flows_list
    )

# === ОБРАБОТКА ВЫПИСКИ ТИНЬКОФФ ===
def parse_tinkoff_amount(amount_str: str) -> Decimal:
    return Decimal(amount_str.replace(',', '.'))

def find_dds_article_by_keywords(description: str, operation_type_for_map: str, default_article_id: int) -> int:
    if not description or not KEYWORD_TO_DDS_ARTICLE_MAP_FROM_FILE:
        # print(f"DEBUG MATCHER: No description or rules not loaded. Using default: {default_article_id}")
        return default_article_id
        
    description_lower = description.lower()
    rules = KEYWORD_TO_DDS_ARTICLE_MAP_FROM_FILE.get(operation_type_for_map, [])
    
    # Отладочный вывод можно оставить закомментированным для обычной работы
    # print(f"\nDEBUG MATCHER: OpType: {operation_type_for_map}, Desc: '{description_lower[:100]}...'")
    # print(f"DEBUG MATCHER: Default Article ID: {default_article_id}")
    # print(f"DEBUG MATCHER: Checking {len(rules)} rules for {operation_type_for_map}...")

    for rule in rules:
        if "keywords" not in rule or "article_id" not in rule:
            continue 
        for keyword in rule["keywords"]:
            if keyword.lower() in description_lower:
                # print(f"DEBUG MATCHER: MATCH! Keyword:'{keyword.lower()}' in Desc:'{description_lower[:50]}...' -> Article ID:{rule['article_id']}")
                return rule["article_id"]
    
    # print(f"DEBUG MATCHER: NO MATCH for '{description_lower[:50]}...'. Using default: {default_article_id}")
    return default_article_id

def process_tinkoff_statement(
    db: Session, 
    csv_data_str: str, 
    account_id: int, 
    default_income_article_id: int,
    default_expense_article_id: int,
    created_by_user_id: int
) -> Dict[str, any]:
    
    created_count = 0
    failed_count = 0
    skipped_duplicates_count = 0
    # errors_list = [] # Оставил закомментированным, если понадобится детальный список ошибок
    
    csvfile = io.StringIO(csv_data_str)
    reader = csv.reader(csvfile, delimiter=';') 

    row_num_for_log = 0

    try:
        next(reader) 
        row_num_for_log +=1
        next(reader) 
        row_num_for_log +=1
    except StopIteration:
        result = {
            "created_count": 0, 
            "failed_rows": 0, 
            "skipped_duplicates_count": 0, 
            # "errors": ["Файл слишком короткий или пустой (не содержит данных после заголовков)."] # Если хотите возвращать ошибки
        }
        print(f"DEBUG CRUD process_tinkoff_statement returning early (short file): {result}")
        return result

    for row_index, row in enumerate(reader):
        current_file_row_num = row_num_for_log + row_index + 1 # Для более точного номера строки в логах
        
        if not row or len(row) < 9:
            failed_count += 1
            continue
        try:
            operation_type_str = row[1].strip()
            operation_date_str = row[2].strip()
            amount_str = row[5].strip()
            description_payment = row[8].strip() 
            
            counterparty_name = ""
            if operation_type_str == "Кредит" and len(row) > 12 and row[12].strip(): counterparty_name = row[12].strip()
            elif operation_type_str == "Дебет" and len(row) > 18 and row[18].strip(): counterparty_name = row[18].strip()
            if not counterparty_name and len(row) > 21 and row[21].strip(): counterparty_name = row[21].strip()

            transaction_date = datetime.strptime(operation_date_str, "%d.%m.%Y").date()
            amount_decimal = parse_tinkoff_amount(amount_str)

            if amount_decimal == Decimal(0):
                continue

            dds_article_id_to_use = 0 
            op_type_for_map = None
            is_income_operation = False

            if operation_type_str == "Кредит":
                op_type_for_map = 'income'
                is_income_operation = True
                dds_article_id_to_use = find_dds_article_by_keywords(description_payment, op_type_for_map, default_income_article_id)
            elif operation_type_str == "Дебет":
                op_type_for_map = 'expense'
                is_income_operation = False
                dds_article_id_to_use = find_dds_article_by_keywords(description_payment, op_type_for_map, default_expense_article_id)
            else:
                print(f"ПРЕДУПРЕЖДЕНИЕ CRUD (строка {current_file_row_num}): Неизвестный тип операции '{operation_type_str}'. Строка пропущена.")
                failed_count += 1
                continue
            
            if dds_article_id_to_use == 0: 
                # print(f"INFO CRUD: Пропуск строки {current_file_row_num} (правило 'пропустить'): '{description_payment[:50]}...'")
                continue 
            
            existing_transaction_query = db.query(models.Transaction).filter(
                models.Transaction.account_id == account_id,
                models.Transaction.transaction_date == transaction_date,
                models.Transaction.amount == amount_decimal
            )
            
            potential_duplicates = existing_transaction_query.all()
            is_duplicate = False
            if potential_duplicates:
                for pot_dup in potential_duplicates:
                    existing_article = db.query(models.DdsArticle).filter(models.DdsArticle.id == pot_dup.dds_article_id).first()
                    if existing_article:
                        current_op_is_income_by_article = (existing_article.article_type == 'income')
                        
                        if is_income_operation == current_op_is_income_by_article:
                            if pot_dup.description == description_payment and \
                               (pot_dup.contractor or '') == (counterparty_name or ''):
                                is_duplicate = True
                                break
            if is_duplicate:
                skipped_duplicates_count += 1
                continue
            
            transaction_data = schemas.TransactionCreate(
                transaction_date=transaction_date,
                amount=amount_decimal,
                description=description_payment,
                contractor=counterparty_name or None,
                account_id=account_id,
                dds_article_id=dds_article_id_to_use
            )
            create_transaction(db=db, transaction=transaction_data, user_id=created_by_user_id)
            created_count += 1

        except (ValueError, InvalidOperation, IndexError) as e:
            print(f"ОШИБКА CRUD (строка {current_file_row_num}): {e}. Данные строки (частично): {row[:9]}")
            failed_count += 1
        except Exception as e: 
            print(f"НЕОЖИДАННАЯ ОШИБКА CRUD (строка {current_file_row_num}): {e}. Данные строки (частично): {row[:9]}")
            failed_count += 1
            
    final_result = {
        "created_count": created_count,
        "failed_rows": failed_count,
        "skipped_duplicates_count": skipped_duplicates_count
    }
    print(f"DEBUG CRUD process_tinkoff_statement returning: {final_result}")
    return final_result