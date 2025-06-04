# app/main.py
import os
from fastapi import FastAPI, Depends, HTTPException, status, Query, File, UploadFile, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import date, timedelta
from decimal import Decimal
from collections import defaultdict

# Импорты из локальных модулей
from . import crud, models, schemas, auth_utils
from .database import engine, get_db # get_db - это зависимость для получения сессии БД

# Создание таблиц в БД (если их нет). В production это делается Alembic'ом.
# models.Base.metadata.create_all(bind=engine) # Закомментировано для продакшен-использования с Alembic'ом

app = FastAPI(title="DDS-Service by Trushin")

# Настройка CORS
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # В production здесь должен быть строгий список разрешенных доменов!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Секция Аутентификации ---

# OAuth2PasswordBearer используется внутри auth_utils.py,
# поэтому здесь его импортировать напрямую не обязательно, если не используется в других местах.

@app.post("/auth/token", response_model=schemas.Token, tags=["Auth"])
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Эндпоинт для получения JWT токена доступа.
    Принимает имя пользователя и пароль, возвращает токен.
    """
    user = auth_utils.authenticate_user(db, username=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Используем константу из auth_utils для срока действия токена
    access_token_expires = timedelta(minutes=auth_utils.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_utils.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# --- Эндпоинты для Пользователей (Users) ---
@app.post("/register/", response_model=schemas.User, status_code=status.HTTP_201_CREATED, tags=["Users"])
def register_user(user_create: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Регистрация нового пользователя.
    Автоматически создает рабочее пространство (Workspace) для нового пользователя.
    """
    db_user_by_username = crud.get_user_by_username(db, username=user_create.username)
    if db_user_by_username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Имя пользователя уже зарегистрировано.")
    
    db_user_by_email = crud.get_user_by_email(db, email=user_create.email)
    if db_user_by_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email уже зарегистрирован.")

    # 1. Создание нового Workspace
    new_workspace = models.Workspace(name=f"Рабочее пространство пользователя {user_create.username}")
    db.add(new_workspace)
    db.flush() # Принудительно получаем ID для new_workspace перед коммитом
    
    # 2. Создание пользователя и связывание его с новым Workspace
    db_user = crud.create_user(db=db, user=user_create, workspace_id=new_workspace.id)
    
    db.commit()
    db.refresh(db_user)
    
    return db_user

@app.get("/users/me/", response_model=schemas.User, tags=["Users"])
async def read_users_me(current_user: models.User = Depends(auth_utils.get_current_active_user)):
    """
    Получение информации о текущем аутентифицированном пользователе.
    """
    return current_user

@app.get("/users/", response_model=List[schemas.User], tags=["Users"])
def read_all_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth_utils.get_current_admin_user) # Защищаем админом
):
    """
    Получение списка всех пользователей. Доступно только администраторам.
    """
    # В этой функции нет фильтрации по workspace_id, так как администратор видит всех пользователей
    users = crud.get_users(db, skip=skip, limit=limit)
    return users

@app.put("/users/{user_id}", response_model=schemas.User, tags=["Users"])
def update_user_admin_endpoint(
    user_id: int, 
    user_update: schemas.UserUpdateAdmin, 
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth_utils.get_current_admin_user) # Защита админом
):
    """
    Обновление данных пользователя администратором.
    Не позволяет изменять username или пароль.
    """
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    # Проверка, если пытаются изменить email на уже существующий у другого пользователя
    if user_update.email and user_update.email != db_user.email:
        existing_user_with_email = crud.get_user_by_email(db, email=user_update.email)
        if existing_user_with_email and existing_user_with_email.id != user_id:
            raise HTTPException(status_code=400, detail="Email уже зарегистрирован другим пользователем")
            
    # Проверка, существует ли новая роль, если она передана
    if user_update.role_id is not None:
        role = crud.get_role(db, role_id=user_update.role_id)
        if not role:
            raise HTTPException(status_code=400, detail=f"Роль с ID {user_update.role_id} не найдена")

    updated_user = crud.update_user_by_admin(db=db, user_id=user_id, user_update=user_update)
    return updated_user

# ================== ЭНДПОИНТЫ ДЛЯ РОЛЕЙ (Roles) - Только для Администраторов ==================
@app.post("/roles/", response_model=schemas.Role, tags=["Roles Management"], status_code=status.HTTP_201_CREATED)
def create_new_role_endpoint(
    role: schemas.RoleCreate, 
    db: Session = Depends(get_db), 
    admin_user: models.User = Depends(auth_utils.get_current_admin_user)
):
    """
    Создание новой роли. Доступно только администраторам.
    """
    db_role = crud.get_role_by_name(db, name=role.name)
    if db_role:
        raise HTTPException(status_code=400, detail="Роль с таким именем уже существует")
    return crud.create_role(db=db, role=role)

@app.get("/roles/", response_model=List[schemas.Role], tags=["Roles Management"])
def read_all_roles_endpoint(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db), 
    admin_user: models.User = Depends(auth_utils.get_current_admin_user)
):
    """
    Получение списка всех ролей. Доступно только администраторам.
    """
    roles = crud.get_roles(db, skip=skip, limit=limit)
    return roles

@app.get("/roles/{role_id}", response_model=schemas.Role, tags=["Roles Management"])
def read_single_role_endpoint(
    role_id: int, 
    db: Session = Depends(get_db), 
    admin_user: models.User = Depends(auth_utils.get_current_admin_user)
):
    """
    Получение информации о конкретной роли по ID. Доступно только администраторам.
    """
    db_role = crud.get_role(db, role_id=role_id)
    if db_role is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Роль не найдена")
    return db_role

@app.put("/roles/{role_id}", response_model=schemas.Role, tags=["Roles Management"])
def update_existing_role_endpoint(
    role_id: int, 
    role_update: schemas.RoleUpdate, 
    db: Session = Depends(get_db), 
    admin_user: models.User = Depends(auth_utils.get_current_admin_user)
):
    """
    Обновление существующей роли. Доступно только администраторам.
    """
    db_role = crud.get_role(db, role_id=role_id)
    if db_role is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Роль не найдена")
    if role_update.name:
        existing_role_with_name = crud.get_role_by_name(db, name=role_update.name)
        if existing_role_with_name and existing_role_with_name.id != role_id:
            raise HTTPException(status_code=400, detail="Роль с таким именем уже существует")
    return crud.update_role(db=db, role_id=role_id, role_update=role_update)

@app.delete("/roles/{role_id}", response_model=schemas.Role, tags=["Roles Management"])
def delete_existing_role_endpoint(
    role_id: int, 
    db: Session = Depends(get_db), 
    admin_user: models.User = Depends(auth_utils.get_current_admin_user)
):
    """
    Удаление роли. Доступно только администраторам.
    Базовые роли (admin, employee) не могут быть удалены.
    """
    if role_id in [1, 2]: # Предполагаем, что 1-admin, 2-employee - базовые роли
        raise HTTPException(status_code=403, detail=f"Невозможно удалить базовую роль с ID {role_id}")
    # TODO: Проверить, есть ли пользователи с этой ролью перед удалением,
    # или настроить CASCADE на уровне БД.
    db_role = crud.delete_role(db, role_id=role_id)
    if db_role is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Роль не найдена")
    return db_role

# ================== ЭНДПОИНТЫ ДЛЯ СТАТЕЙ ДДС (DDS Articles) ==================
@app.post("/articles/", response_model=schemas.DdsArticle, tags=["DDS Articles"], status_code=status.HTTP_201_CREATED)
async def create_dds_article_endpoint(
    article: schemas.DdsArticleCreate, 
    db: Session = Depends(get_db),
    # Добавляем зависимость для получения workspace_id текущего пользователя
    workspace_id: int = Depends(auth_utils.get_current_workspace_id)
):
    """
    Создание новой статьи ДДС в текущем рабочем пространстве пользователя.
    """
    # Проверка на уникальность имени в рамках workspace и типа
    existing_article = db.query(models.DdsArticle).filter(
        models.DdsArticle.name == article.name,
        models.DdsArticle.article_type == article.article_type,
        models.DdsArticle.workspace_id == workspace_id
    ).first()
    if existing_article:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Статья ДДС с таким именем и типом уже существует в вашем рабочем пространстве."
        )
    return crud.create_dds_article(db=db, article=article, workspace_id=workspace_id)

@app.get("/articles/", response_model=List[schemas.DdsArticle], tags=["DDS Articles"])
async def read_all_articles_endpoint(
    db: Session = Depends(get_db),
    # Добавляем зависимость для фильтрации по workspace_id
    workspace_id: int = Depends(auth_utils.get_current_workspace_id)
):
    """
    Получение всех статей ДДС для текущего рабочего пространства пользователя.
    """
    articles = crud.get_dds_articles(db, workspace_id=workspace_id)
    return articles

@app.get("/articles/{article_id}", response_model=schemas.DdsArticle, tags=["DDS Articles"])
async def read_single_article_endpoint(
    article_id: int, 
    db: Session = Depends(get_db),
    # Добавляем зависимость для фильтрации по workspace_id
    workspace_id: int = Depends(auth_utils.get_current_workspace_id)
):
    """
    Получение статьи ДДС по ID для текущего рабочего пространства пользователя.
    """
    db_article = crud.get_dds_article(db, article_id=article_id, workspace_id=workspace_id)
    if db_article is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Статья ДДС не найдена или не принадлежит вашему рабочему пространству")
    return db_article

@app.put("/articles/{article_id}", response_model=schemas.DdsArticle, tags=["DDS Articles"])
async def update_dds_article_endpoint(
    article_id: int, 
    article: schemas.DdsArticleUpdate, 
    db: Session = Depends(get_db),
    # Добавляем зависимость для защиты по workspace_id
    workspace_id: int = Depends(auth_utils.get_current_workspace_id)
):
    """
    Обновление статьи ДДС в текущем рабочем пространстве пользователя.
    """
    db_article = crud.update_dds_article(db, article_id=article_id, article=article, workspace_id=workspace_id)
    if db_article is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Статья ДДС не найдена или не принадлежит вашему рабочему пространству")
    return db_article

@app.delete("/articles/{article_id}", response_model=schemas.DdsArticle, tags=["DDS Articles"])
async def delete_dds_article_endpoint(
    article_id: int, 
    db: Session = Depends(get_db),
    # Добавляем зависимость для защиты по workspace_id
    workspace_id: int = Depends(auth_utils.get_current_workspace_id)
):
    """
    Удаление статьи ДДС из текущего рабочего пространства пользователя.
    """
    db_article = crud.delete_dds_article(db, article_id=article_id, workspace_id=workspace_id)
    if db_article is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Статья ДДС не найдена или не принадлежит вашему рабочему пространству")
    return db_article

# ================== ЭНДПОИНТЫ ДЛЯ СЧЕТОВ (Accounts) ==================
@app.post("/accounts/", response_model=schemas.Account, tags=["Accounts"], status_code=status.HTTP_201_CREATED)
async def create_account_endpoint(
    account: schemas.AccountCreate, 
    db: Session = Depends(get_db),
    # Добавляем зависимость для защиты по workspace_id
    workspace_id: int = Depends(auth_utils.get_current_workspace_id)
):
    """
    Создание нового счета в текущем рабочем пространстве пользователя.
    """
    # Проверка на уникальность имени счета в пределах рабочего пространства
    existing_account = db.query(models.Account).filter(
        models.Account.name == account.name,
        models.Account.workspace_id == workspace_id
    ).first()
    if existing_account:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Счет с таким именем уже существует в вашем рабочем пространстве."
        )
    return crud.create_account(db=db, account=account, workspace_id=workspace_id)

@app.get("/accounts/", response_model=List[schemas.Account], tags=["Accounts"])
async def read_all_accounts_endpoint(
    skip: int = Query(0, ge=0, description="Количество пропускаемых записей (для пагинации)"), 
    limit: int = Query(100, ge=1, le=500, description="Количество записей на страницу (для пагинации)"), 
    account_ids: Optional[List[int]] = Query(None, description="Список ID счетов для фильтрации"),
    is_active: Optional[bool] = Query(None, description="Фильтр по статусу активности"),
    db: Session = Depends(get_db),
    # Добавляем зависимость для фильтрации по workspace_id
    workspace_id: int = Depends(auth_utils.get_current_workspace_id)
):
    """
    Получение всех счетов для текущего рабочего пространства пользователя.
    """
    accounts = crud.get_accounts(db, workspace_id=workspace_id, skip=skip, limit=limit, account_ids=account_ids, is_active=is_active)
    return accounts

@app.get("/accounts/{account_id}", response_model=schemas.Account, tags=["Accounts"])
async def read_single_account_endpoint(
    account_id: int, 
    db: Session = Depends(get_db),
    # Добавляем зависимость для фильтрации по workspace_id
    workspace_id: int = Depends(auth_utils.get_current_workspace_id)
):
    """
    Получение счета по ID для текущего рабочего пространства пользователя.
    """
    db_account = crud.get_account(db, account_id=account_id, workspace_id=workspace_id)
    if db_account is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Счет не найден или не принадлежит вашему рабочему пространству")
    return db_account

@app.put("/accounts/{account_id}", response_model=schemas.Account, tags=["Accounts"])
async def update_account_endpoint(
    account_id: int, 
    account: schemas.AccountUpdate, 
    db: Session = Depends(get_db),
    # Добавляем зависимость для защиты по workspace_id
    workspace_id: int = Depends(auth_utils.get_current_workspace_id)
):
    """
    Обновление счета в текущем рабочем пространстве пользователя.
    """
    db_account = crud.update_account(db, account_id=account_id, account=account, workspace_id=workspace_id)
    if db_account is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Счет не найден или не принадлежит вашему рабочему пространству")
    return db_account

@app.delete("/accounts/{account_id}", response_model=schemas.Account, tags=["Accounts"])
async def delete_account_endpoint(
    account_id: int, 
    db: Session = Depends(get_db),
    # Добавляем зависимость для защиты по workspace_id
    workspace_id: int = Depends(auth_utils.get_current_workspace_id)
):
    """
    Удаление счета из текущего рабочего пространства пользователя.
    """
    deleted_account = crud.delete_account(db, account_id=account_id, workspace_id=workspace_id)
    if deleted_account is None: # Проверяем на None, а не на HTTPException
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Счет не найден или не принадлежит вашему рабочему пространству")
    # Возвращаем статус 204 No Content, так как тело ответа не требуется для DELETE
    return {"message": "Счет успешно удален"}


# ================== ЭНДПОИНТЫ ДЛЯ ТРАНЗАКЦИЙ ==================
@app.post("/transactions/", response_model=schemas.Transaction, tags=["Transactions"], status_code=status.HTTP_201_CREATED)
async def create_transaction_endpoint(
    transaction: schemas.TransactionCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user), # Для user_id и проверки активности
    # Добавляем зависимость для фильтрации по workspace_id
    workspace_id: int = Depends(auth_utils.get_current_workspace_id)
):
    """
    Создание новой транзакции в текущем рабочем пространстве пользователя.
    """
    try:
        return crud.create_transaction(
            db=db, 
            transaction=transaction, 
            user_id=current_user.id, # Передаем ID текущего пользователя
            workspace_id=workspace_id # Передаем workspace_id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@app.get("/transactions/", response_model=schemas.TransactionsPageResponse, tags=["Transactions"])
async def read_all_transactions_endpoint(
    skip: int = Query(0, ge=0, description="Количество пропускаемых записей (для пагинации)"), 
    limit: int = Query(100, ge=1, le=500, description="Количество записей на страницу (для пагинации)"), 
    start_date: Optional[date] = Query(None, description="Начальная дата (ГГГГ-ММ-ДД)"),
    end_date: Optional[date] = Query(None, description="Конечная дата (ГГГГ-ММ-ДД)"),
    account_id: Optional[int] = Query(None, description="ID счета/кассы"),
    min_amount: Optional[Decimal] = Query(None, description="Минимальная сумма транзакции", ge=0),
    max_amount: Optional[Decimal] = Query(None, description="Максимальная сумма транзакции", ge=0),
    dds_article_ids: Optional[List[int]] = Query(None, description="Список ID статей ДДС для фильтрации"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user), # Для аутентификации
    # Добавляем зависимость для фильтрации по workspace_id
    workspace_id: int = Depends(auth_utils.get_current_workspace_id)
):
    """
    Получение всех транзакций для текущего рабочего пространства пользователя.
    """
    transactions_list, total_count = crud.get_transactions(
        db, 
        workspace_id=workspace_id, # Передаем workspace_id для фильтрации
        skip=skip, limit=limit, 
        start_date=start_date, end_date=end_date, account_id=account_id,
        min_amount=min_amount, max_amount=max_amount,
        dds_article_ids=dds_article_ids
    )
    return schemas.TransactionsPageResponse(items=transactions_list, total_count=total_count)

@app.get("/transactions/{transaction_id}", response_model=schemas.Transaction, tags=["Transactions"])
async def read_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user), # Для аутентификации
    # Добавляем зависимость для фильтрации по workspace_id
    workspace_id: int = Depends(auth_utils.get_current_workspace_id)
):
    """
    Получение транзакции по ID для текущего рабочего пространства пользователя.
    """
    transaction = crud.get_transaction(db, transaction_id=transaction_id, workspace_id=workspace_id)
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Транзакция не найдена или не принадлежит вашему рабочему пространству")
    return transaction

@app.put("/transactions/{transaction_id}/", response_model=schemas.Transaction, tags=["Transactions"])
async def update_full_transaction_endpoint(
    transaction_id: int,
    transaction_update: schemas.TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user), # Для user_id и проверки активности
    # Добавляем зависимость для фильтрации по workspace_id
    workspace_id: int = Depends(auth_utils.get_current_workspace_id)
):
    """
    Полное обновление существующей транзакции в текущем рабочем пространстве пользователя.
    """
    try:
        updated_transaction = crud.update_transaction(
            db=db, 
            transaction_id=transaction_id, 
            transaction_update_data=transaction_update, 
            user_id=current_user.id, # Передаем user_id для возможного аудита
            workspace_id=workspace_id # Передаем workspace_id для фильтрации
        )
        if not updated_transaction:
            raise HTTPException(status_code=404, detail="Транзакция не найдена или не принадлежит вашему рабочему пространству.")
        return updated_transaction
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@app.delete("/transactions/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Transactions"])
async def delete_transaction_endpoint(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user), # Для аутентификации
    # Добавляем зависимость для фильтрации по workspace_id
    workspace_id: int = Depends(auth_utils.get_current_workspace_id)
):
    """
    Удаление транзакции из текущего рабочего пространства пользователя с пересчетом баланса счета.
    """
    deleted_transaction = crud.delete_transaction(db, transaction_id=transaction_id, workspace_id=workspace_id)
    if deleted_transaction is None:
        raise HTTPException(status_code=404, detail="Транзакция не найдена или не принадлежит вашему рабочему пространству.")
    # Возвращаем статус 204 No Content, так как тело ответа не требуется для DELETE
    # Если ты хочешь вернуть 204 No Content, можно просто `return Response(status_code=status.HTTP_204_NO_CONTENT)`
    return {"message": "Транзакция успешно удалена"}

# ================== ЭНДПОИНТЫ ДЛЯ ОТЧЕТОВ ==================
@app.get("/reports/dds/", response_model=schemas.DDSReportData, tags=["Reports"])
async def get_dds_report_endpoint(
    start_date: date,
    end_date: date,
    account_ids: Optional[List[int]] = Query(None, description="Список ID счетов для фильтрации отчета"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user), # Для аутентификации
    # Добавляем зависимость для фильтрации по workspace_id
    workspace_id: int = Depends(auth_utils.get_current_workspace_id)
):
    """
    Получение отчета ДДС для текущего рабочего пространства пользователя.
    """
    report_data = crud.get_dds_report_data(
        db=db, 
        workspace_id=workspace_id, # Передаем workspace_id для фильтрации
        start_date=start_date, 
        end_date=end_date, 
        account_ids=account_ids
    )
    return report_data

@app.get("/reports/account-balances/", response_model=schemas.AccountBalancesReportData, tags=["Reports"])
async def get_account_balances_report_endpoint(
    as_of_date: date = Query(default_factory=date.today, description="Дата, на которую запрашиваются остатки"), 
    account_ids: Optional[List[int]] = Query(None, description="Список ID счетов для включения в отчет"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user), # Для аутентификации
    # Добавляем зависимость для фильтрации по workspace_id
    workspace_id: int = Depends(auth_utils.get_current_workspace_id)
):
    """
    Получение отчета по балансам счетов для текущего рабочего пространства пользователя.
    """
    # Фильтрация по workspace_id будет применена в crud.get_accounts
    accounts_from_db = crud.get_accounts(db, workspace_id=workspace_id, limit=1000, account_ids=account_ids, is_active=True)

    balance_items: List[schemas.AccountBalanceItem] = []
    total_balances_by_currency = defaultdict(Decimal)

    for acc in accounts_from_db:
        balance_items.append(schemas.AccountBalanceItem(
            account_id=acc.id,
            account_name=acc.name,
            account_type=acc.account_type,
            currency=acc.currency,
            current_balance=acc.current_balance
        ))
        total_balances_by_currency[acc.currency] += acc.current_balance
    
    return schemas.AccountBalancesReportData(
        report_date=as_of_date,
        balances=balance_items,
        total_balances_by_currency=dict(total_balances_by_currency)
    )

# ================== ЭНДПОИНТЫ ДЛЯ ДАШБОРДА ==================
@app.get("/dashboard/kpis", response_model=schemas.DashboardKPIs, tags=["Dashboard"])
async def get_kpis_endpoint(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user), # Для аутентификации
    # Добавляем зависимость для фильтрации по workspace_id
    workspace_id: int = Depends(auth_utils.get_current_workspace_id)
):
    """
    Получение ключевых показателей (KPI) для дашборда текущего рабочего пространства пользователя.
    """
    return crud.get_dashboard_kpis(db=db, workspace_id=workspace_id)

@app.get("/dashboard/cashflow-trend", response_model=schemas.CashFlowTrend, tags=["Dashboard"])
async def get_cashflow_trend_endpoint(
    start_date_param: Optional[date] = Query(None, alias="start_date", description="Начальная дата (ГГГГ-ММ-ДД)"),
    end_date_param: Optional[date] = Query(None, alias="end_date", description="Конечная дата (ГГГГ-ММ-ДД)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user), # Для аутентификации
    # Добавляем зависимость для фильтрации по workspace_id
    workspace_id: int = Depends(auth_utils.get_current_workspace_id)
):
    """
    Получение данных тренда денежного потока для дашборда текущего рабочего пространства пользователя.
    """
    final_start_date = start_date_param if start_date_param is not None else date.today() - timedelta(days=29)
    final_end_date = end_date_param if end_date_param is not None else date.today()

    if final_start_date > final_end_date:
        raise HTTPException(status_code=400, detail="Дата начала не может быть позже даты окончания")
    return crud.get_cash_flow_trend_data(db=db, workspace_id=workspace_id, start_date=final_start_date, end_date=final_end_date)

# ================== ЗАГРУЗКА ВЫПИСОК ==================
@app.post("/statements/upload/tinkoff-csv/", response_model=schemas.StatementUploadResponse, tags=["Statement Uploads"])
async def upload_tinkoff_csv_statement(
    file: UploadFile = File(..., description="CSV файл выписки от Тинькофф Банка"),
    account_id: int = Form(..., description="ID счета в вашей системе, к которому относится выписка"),
    default_income_article_id: int = Form(..., description="ID статьи ДДС для непроклассифицированных доходов"),
    default_expense_article_id: int = Form(..., description="ID статьи ДДС для непроклассифицированных расходов"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_active_user), # Для user_id
    # Добавляем зависимость для фильтрации по workspace_id
    workspace_id: int = Depends(auth_utils.get_current_workspace_id)
):
    """
    Загрузка и обработка CSV выписки Тинькофф Банка для текущего рабочего пространства пользователя.
    """
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Неверный формат файла или имя файла отсутствует. Пожалуйста, загрузите CSV файл.")

    try:
        contents = await file.read()
        file_data_str = contents.decode('utf-8') 
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Не удалось прочитать файл: {e}")
    finally:
        await file.close()

    # Проверяем, что account_id, default_income_article_id и default_expense_article_id
    # принадлежат текущему workspace_id пользователя.
    crud.validate_workspace_ownership_for_ids(
        db,
        workspace_id=workspace_id,
        account_ids=[account_id],
        dds_article_ids=[default_income_article_id, default_expense_article_id]
    )

    processed_info = crud.process_tinkoff_statement(
        db=db, 
        csv_data_str=file_data_str, 
        account_id=account_id, 
        default_income_article_id=default_income_article_id,
        default_expense_article_id=default_expense_article_id,
        created_by_user_id=current_user.id,
        workspace_id=workspace_id # Передаем workspace_id в обработчик
    )
    
    return schemas.StatementUploadResponse(
        message="Выписка обработана.",
        created_transactions=processed_info.get("created_count", 0),
        failed_rows=processed_info.get("failed_rows", 0),
        skipped_duplicates_count=processed_info.get("skipped_duplicates_count", 0),
        created_transactions_auto=processed_info.get("created_transactions_auto", 0),
        transactions_for_review=processed_info.get("transactions_for_review", [])
    )