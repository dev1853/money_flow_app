# app/main.py
from fastapi import FastAPI, Depends, HTTPException, status, Query, File, UploadFile, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import date, timedelta # Убедитесь, что timedelta импортирован
from decimal import Decimal
from pydantic import BaseModel # Для локальных схем, если schemas.py не покрывает все
from collections import defaultdict

from . import crud, models, schemas, auth_utils
from .database import engine, get_db

# Создание таблиц в БД (если их нет)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="DDS-Service by Trushin")

# Настройка CORS
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # В продакшене здесь должен быть список разрешенных доменов
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Секция Аутентификации ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

@app.post("/auth/token", response_model=schemas.Token, tags=["Auth"])
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth_utils.authenticate_user(db, username=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth_utils.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_utils.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    username = auth_utils.decode_token(token)
    if username is None:
        raise credentials_exception
    user_model = crud.get_user_by_username(db, username=username)
    if user_model is None:
        raise credentials_exception
    return user_model

async def get_current_active_user(current_user: models.User = Depends(get_current_user)) -> models.User:
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user

# Зависимость для проверки прав администратора
async def get_current_admin_user(current_user: models.User = Depends(get_current_active_user)) -> models.User:
    if not current_user.role_id or current_user.role_id != 1: # Предполагаем, ID=1 это 'admin'
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Not enough permissions. Administrator access required."
        )
    return current_user

# --- Эндпоинты для Пользователей (Users) ---
@app.post("/users/", response_model=schemas.User, status_code=status.HTTP_201_CREATED, tags=["Users"])
def register_new_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user_by_username = crud.get_user_by_username(db, username=user.username)
    if db_user_by_username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered")
    db_user_by_email = crud.get_user_by_email(db, email=user.email)
    if db_user_by_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.get("/users/me/", response_model=schemas.User, tags=["Users"])
async def read_users_me(current_user: models.User = Depends(get_current_active_user)):
    return current_user

@app.get("/users/", response_model=List[schemas.User], tags=["Users"])
def read_all_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user) # <-- ИЗМЕНЕНИЕ: Защищаем админом
):
    """
    Получение списка всех пользователей. Доступно только администраторам.
    """
    users = crud.get_users(db, skip=skip, limit=limit)
    return users

@app.put("/users/{user_id}", response_model=schemas.User, tags=["Users"])
def update_user_admin_endpoint( # Добавил _endpoint
    user_id: int, 
    user_update: schemas.UserUpdateAdmin, 
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user) # Защита админом
):
    """
    Обновление данных пользователя администратором.
    Не позволяет изменять username или пароль.
    """
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Проверка, если пытаются изменить email на уже существующий у другого пользователя
    if user_update.email and user_update.email != db_user.email:
        existing_user_with_email = crud.get_user_by_email(db, email=user_update.email)
        if existing_user_with_email and existing_user_with_email.id != user_id:
            raise HTTPException(status_code=400, detail="Email already registered by another user")
            
    # Проверка, существует ли новая роль, если она передана
    if user_update.role_id is not None:
        role = crud.get_role(db, role_id=user_update.role_id)
        if not role:
            raise HTTPException(status_code=400, detail=f"Role with id {user_update.role_id} not found")


    updated_user = crud.update_user_by_admin(db=db, user_id=user_id, user_update=user_update)
    return updated_user

@app.post("/users/", response_model=schemas.User, status_code=status.HTTP_201_CREATED, tags=["Users"])
def register_new_user(user: schemas.UserCreate, db: Session = Depends(get_db)): # НЕТ ЗАЩИТЫ
    db_user_by_username = crud.get_user_by_username(db, username=user.username)
    if db_user_by_username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Имя пользователя уже занято")
    db_user_by_email = crud.get_user_by_email(db, email=user.email)
    if db_user_by_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email уже зарегистрирован")
    return crud.create_user(db=db, user=user)

# ================== ЭНДПОИНТЫ ДЛЯ РОЛЕЙ (Roles) - Только для Администраторов ==================
@app.post("/roles/", response_model=schemas.Role, tags=["Roles Management"], status_code=status.HTTP_201_CREATED)
def create_new_role_endpoint( # Добавил _endpoint
    role: schemas.RoleCreate, 
    db: Session = Depends(get_db), 
    admin_user: models.User = Depends(get_current_admin_user)
):
    db_role = crud.get_role_by_name(db, name=role.name)
    if db_role:
        raise HTTPException(status_code=400, detail="Role with this name already exists")
    return crud.create_role(db=db, role=role)

@app.get("/roles/", response_model=List[schemas.Role], tags=["Roles Management"])
def read_all_roles_endpoint(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db), 
    admin_user: models.User = Depends(get_current_admin_user)
):
    roles = crud.get_roles(db, skip=skip, limit=limit)
    return roles

@app.get("/roles/{role_id}", response_model=schemas.Role, tags=["Roles Management"])
def read_single_role_endpoint(
    role_id: int, 
    db: Session = Depends(get_db), 
    admin_user: models.User = Depends(get_current_admin_user)
):
    db_role = crud.get_role(db, role_id=role_id)
    if db_role is None:
        raise HTTPException(status_code=status.HTTP_404, detail="Role not found")
    return db_role

@app.put("/roles/{role_id}", response_model=schemas.Role, tags=["Roles Management"])
def update_existing_role_endpoint(
    role_id: int, 
    role_update: schemas.RoleUpdate, 
    db: Session = Depends(get_db), 
    admin_user: models.User = Depends(get_current_admin_user)
):
    db_role = crud.get_role(db, role_id=role_id)
    if db_role is None:
        raise HTTPException(status_code=status.HTTP_404, detail="Role not found")
    if role_update.name:
        existing_role_with_name = crud.get_role_by_name(db, name=role_update.name)
        if existing_role_with_name and existing_role_with_name.id != role_id:
            raise HTTPException(status_code=400, detail="Role with this name already exists")
    return crud.update_role(db=db, role_id=role_id, role_update=role_update)

@app.delete("/roles/{role_id}", response_model=schemas.Role, tags=["Roles Management"])
def delete_existing_role_endpoint(
    role_id: int, 
    db: Session = Depends(get_db), 
    admin_user: models.User = Depends(get_current_admin_user)
):
    if role_id in [1, 2]: # Предполагаем, что 1-admin, 2-employee - базовые роли
        raise HTTPException(status_code=403, detail=f"Cannot delete base role ID {role_id}")
    # TODO: Проверить, есть ли пользователи с этой ролью перед удалением
    db_role = crud.delete_role(db, role_id=role_id)
    if db_role is None:
        raise HTTPException(status_code=status.HTTP_404, detail="Role not found")
    return db_role

# ================== ЭНДПОИНТЫ ДЛЯ СТАТЕЙ ДДС (DDS Articles) ==================
# TODO: В будущем эти эндпоинты также стоит защитить (например, Depends(get_current_active_user))
@app.post("/articles/", response_model=schemas.DdsArticle, tags=["DDS Articles"], status_code=status.HTTP_201_CREATED)
def create_dds_article_endpoint(article: schemas.DdsArticleCreate, db: Session = Depends(get_db)):
    return crud.create_dds_article(db=db, article=article)

@app.get("/articles/", response_model=List[schemas.DdsArticle], tags=["DDS Articles"])
def read_all_articles_endpoint(db: Session = Depends(get_db)):
    articles = crud.get_dds_articles(db)
    return articles

@app.get("/articles/{article_id}", response_model=schemas.DdsArticle, tags=["DDS Articles"])
def read_single_article_endpoint(article_id: int, db: Session = Depends(get_db)):
    db_article = crud.get_dds_article(db, article_id=article_id)
    if db_article is None:
        raise HTTPException(status_code=status.HTTP_404, detail="Article not found")
    return db_article

@app.put("/articles/{article_id}", response_model=schemas.DdsArticle, tags=["DDS Articles"])
def update_dds_article_endpoint(article_id: int, article: schemas.DdsArticleUpdate, db: Session = Depends(get_db)):
    db_article = crud.update_dds_article(db, article_id=article_id, article=article)
    if db_article is None:
        raise HTTPException(status_code=status.HTTP_404, detail="Article not found")
    return db_article

@app.delete("/articles/{article_id}", response_model=schemas.DdsArticle, tags=["DDS Articles"])
def delete_dds_article_endpoint(article_id: int, db: Session = Depends(get_db)):
    db_article = crud.delete_dds_article(db, article_id=article_id)
    if db_article is None:
        raise HTTPException(status_code=status.HTTP_404, detail="Article not found")
    return db_article

# ================== ЭНДПОИНТЫ ДЛЯ СЧЕТОВ (Accounts) ==================
# TODO: В будущем эти эндпоинты также стоит защитить
@app.post("/accounts/", response_model=schemas.Account, tags=["Accounts"], status_code=status.HTTP_201_CREATED)
def create_account_endpoint(account: schemas.AccountCreate, db: Session = Depends(get_db)):
    return crud.create_account(db=db, account=account)

@app.get("/accounts/", response_model=List[schemas.Account], tags=["Accounts"])
def read_all_accounts_endpoint(
    skip: int = 0, 
    limit: int = 100, 
    account_ids: Optional[List[int]] = Query(None, description="Список ID счетов для фильтрации"),
    is_active: Optional[bool] = Query(None, description="Фильтр по статусу активности"),
    db: Session = Depends(get_db)
):
    accounts = crud.get_accounts(db, skip=skip, limit=limit, account_ids=account_ids, is_active=is_active)
    return accounts

@app.get("/accounts/{account_id}", response_model=schemas.Account, tags=["Accounts"])
def read_single_account_endpoint(account_id: int, db: Session = Depends(get_db)):
    db_account = crud.get_account(db, account_id=account_id)
    if db_account is None:
        raise HTTPException(status_code=status.HTTP_404, detail="Account not found")
    return db_account

@app.put("/accounts/{account_id}", response_model=schemas.Account, tags=["Accounts"])
def update_account_endpoint(account_id: int, account: schemas.AccountUpdate, db: Session = Depends(get_db)):
    db_account = crud.update_account(db, account_id=account_id, account=account)
    if db_account is None:
        raise HTTPException(status_code=status.HTTP_404, detail="Account not found")
    return db_account

@app.delete("/accounts/{account_id}", response_model=schemas.Account, tags=["Accounts"])
def delete_account_endpoint(account_id: int, db: Session = Depends(get_db)):
    db_account = crud.delete_account(db, account_id=account_id)
    if db_account is None:
        raise HTTPException(status_code=status.HTTP_404, detail="Account not found")
    return db_account

# ================== ЭНДПОИНТЫ ДЛЯ ТРАНЗАКЦИЙ ==================
@app.post("/transactions/", response_model=schemas.Transaction, tags=["Transactions"], status_code=status.HTTP_201_CREATED)
def create_transaction_endpoint(
    transaction: schemas.TransactionCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.create_transaction(db=db, transaction=transaction, user_id=current_user.id)

@app.get("/transactions/", response_model=schemas.TransactionsPageResponse, tags=["Transactions"]) # <-- ИЗМЕНЕН response_model
def read_all_transactions_endpoint(
    skip: int = Query(0, ge=0, description="Количество пропускаемых записей (для пагинации)"), 
    limit: int = Query(100, ge=1, le=500, description="Количество записей на страницу (для пагинации)"), 
    start_date: Optional[date] = Query(None, description="Начальная дата (ГГГГ-ММ-ДД)"),
    end_date: Optional[date] = Query(None, description="Конечная дата (ГГГГ-ММ-ДД)"),
    account_id: Optional[int] = Query(None, description="ID счета/кассы"),
    min_amount: Optional[Decimal] = Query(None, description="Минимальная сумма транзакции", ge=0),
    max_amount: Optional[Decimal] = Query(None, description="Максимальная сумма транзакции", ge=0),
    dds_article_ids: Optional[List[int]] = Query(None, description="Список ID статей ДДС для фильтрации"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    transactions_list, total_count = crud.get_transactions( # <-- Получаем кортеж
        db, skip=skip, limit=limit, 
        start_date=start_date, end_date=end_date, account_id=account_id,
        min_amount=min_amount, max_amount=max_amount,
        dds_article_ids=dds_article_ids
    )
    return schemas.TransactionsPageResponse(items=transactions_list, total_count=total_count) # <-- Формируем новый ответ

@app.put("/transactions/{transaction_id}/", response_model=schemas.Transaction, tags=["Transactions"])
def update_full_transaction_endpoint( # Новое имя функции
    transaction_id: int,
    transaction_update: schemas.TransactionUpdate, # Используем новую полную схему обновления
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Полное обновление существующей транзакции с пересчетом балансов.
    """
    updated_transaction = crud.update_transaction(
        db=db, 
        transaction_id=transaction_id, 
        transaction_update_data=transaction_update, # Передаем новый объект схемы
        user_id=current_user.id # Передаем user_id для возможного аудита
    )
    if not updated_transaction:
        raise HTTPException(status_code=404, detail="Транзакция не найдена или произошла ошибка при обновлении.")
    return updated_transaction

@app.delete("/transactions/{transaction_id}", response_model=schemas.Transaction, tags=["Transactions"]) # Убрал лишний слэш в конце
def delete_transaction_endpoint(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Удаление транзакции с пересчетом баланса счета.
    """
    deleted_transaction = crud.delete_transaction(db, transaction_id=transaction_id)
    if not deleted_transaction:
        raise HTTPException(status_code=404, detail="Транзакция не найдена или произошла ошибка при удалении.")
    # Возвращаем удаленный объект (он еще доступен в сессии до ее закрытия)
    # Или можно вернуть статус 204 No Content, если не нужно возвращать тело
    return deleted_transaction

# ================== ЭНДПОИНТЫ ДЛЯ ОТЧЕТОВ ==================
@app.get("/reports/dds/", response_model=schemas.DDSReportData, tags=["Reports"])
def get_dds_report_endpoint(
    start_date: date,
    end_date: date,
    account_ids: Optional[List[int]] = Query(None, description="Список ID счетов для фильтрации отчета"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    report_data = crud.get_dds_report_data(
        db=db, 
        start_date=start_date, 
        end_date=end_date, 
        account_ids=account_ids
    )
    return report_data

@app.get("/reports/account-balances/", response_model=schemas.AccountBalancesReportData, tags=["Reports"])
def get_account_balances_report_endpoint(
    as_of_date: date = Query(default_factory=date.today, description="Дата, на которую запрашиваются остатки"), 
    account_ids: Optional[List[int]] = Query(None, description="Список ID счетов для включения в отчет"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    active_filter = True if not account_ids else None
    accounts_from_db = crud.get_accounts(db, limit=1000, account_ids=account_ids, is_active=active_filter)

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
        total_balances_by_currency=dict(total_balances_by_currency) # Преобразуем defaultdict в dict
    )

# ================== ЭНДПОИНТЫ ДЛЯ ДАШБОРДА ==================
@app.get("/dashboard/kpis", response_model=schemas.DashboardKPIs, tags=["Dashboard"])
def get_kpis_endpoint(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.get_dashboard_kpis(db=db)

@app.get("/dashboard/cashflow-trend", response_model=schemas.CashFlowTrend, tags=["Dashboard"])
def get_cashflow_trend_endpoint(
    start_date_param: Optional[date] = Query(None, alias="start_date", description="Начальная дата (ГГГГ-ММ-ДД)"), # Используем alias
    end_date_param: Optional[date] = Query(None, alias="end_date", description="Конечная дата (ГГГГ-ММ-ДД)"),     # Используем alias
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    final_start_date = start_date_param if start_date_param is not None else date.today() - timedelta(days=29)
    final_end_date = end_date_param if end_date_param is not None else date.today()

    if final_start_date > final_end_date:
        raise HTTPException(status_code=400, detail="Дата начала не может быть позже даты окончания")
    return crud.get_cash_flow_trend_data(db=db, start_date=final_start_date, end_date=final_end_date)

# ================== ЗАГРУЗКА ВЫПИСОК ==================
@app.post("/statements/upload/tinkoff-csv/", response_model=schemas.StatementUploadResponse, tags=["Statement Uploads"])
async def upload_tinkoff_csv_statement(
    file: UploadFile = File(..., description="CSV файл выписки от Тинькофф Банка"),
    account_id: int = Form(..., description="ID счета в вашей системе, к которому относится выписка"),
    default_income_article_id: int = Form(..., description="ID статьи ДДС для непроклассифицированных доходов"),
    default_expense_article_id: int = Form(..., description="ID статьи ДДС для непроклассифицированных расходов"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if not file.filename or not file.filename.endswith('.csv'): # Проверка имени файла
        raise HTTPException(status_code=400, detail="Неверный формат файла или имя файла отсутствует. Пожалуйста, загрузите CSV файл.")

    try:
        contents = await file.read()
        file_data_str = contents.decode('utf-8') 
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Не удалось прочитать файл: {e}")
    finally:
        await file.close()

    processed_info = crud.process_tinkoff_statement(
        db=db, 
        csv_data_str=file_data_str, 
        account_id=account_id, 
        default_income_article_id=default_income_article_id,
        default_expense_article_id=default_expense_article_id,
        created_by_user_id=current_user.id
    )
    
    # Убедимся, что processed_info содержит все ключи, ожидаемые схемой
    return schemas.StatementUploadResponse(
        message="Выписка обработана.",
        created_transactions=processed_info.get("created_count", 0), # Используем .get() для безопасности
        failed_rows=processed_info.get("failed_rows", 0),
        skipped_duplicates_count=processed_info.get("skipped_duplicates_count", 0),
        # Для совместимости с последней ошибкой, где схема ожидала created_transactions_auto и transactions_for_review
        # Если вы вернулись к схеме, где эти поля есть:
        created_transactions_auto=processed_info.get("created_transactions_auto", 0),
        transactions_for_review=processed_info.get("transactions_for_review", [])
    )