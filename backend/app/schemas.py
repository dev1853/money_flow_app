# app/schemas.py
from pydantic import BaseModel # Используем BaseModel из Pydantic
from typing import Optional, List, Dict, Any
from decimal import Decimal
from datetime import date, datetime

# --- СХЕМЫ ДЛЯ РОЛЕЙ (Roles) ---
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: Optional[Dict[str, Any]] = None 

    class Config:
        from_attributes = True

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel): 
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[Dict[str, Any]] = None
    class Config:
        from_attributes = True

class Role(RoleBase):
    id: int
    # Config унаследуется от RoleBase
# =====================================

# --- СХЕМЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ (Users) ---
class UserBase(BaseModel):
    username: str
    email: str # Используем str, а не EmailStr, если ранее были проблемы с валидацией .local
    full_name: Optional[str] = None
    class Config:
        from_attributes = True

class UserCreate(UserBase):
    password: str
    role_id: int = 2 # По умолчанию 'employee' (ID 2)
    is_active: bool = True

class User(UserBase): 
    id: int
    role_id: int 
    is_active: bool
    role: Optional[Role] = None # Для отображения информации о роли

    class Config:
        from_attributes = True

class UserUpdateAdmin(BaseModel): # Схема для обновления пользователя администратором
    email: Optional[str] = None 
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    role_id: Optional[int] = None
    # Пароль здесь не меняем
    class Config:
        from_attributes = True
# =====================================

# --- СХЕМЫ ДЛЯ СТАТЕЙ ДДС (DDS Articles) ---
class DdsArticleBase(BaseModel):
    name: str
    article_type: str # "income" или "expense"
    is_archived: bool = False
    parent_id: Optional[int] = None
    class Config:
        from_attributes = True

class DdsArticleCreate(DdsArticleBase):
    pass

class DdsArticleUpdate(BaseModel): 
    name: Optional[str] = None
    article_type: Optional[str] = None
    is_archived: Optional[bool] = None
    parent_id: Optional[int] = None 
    class Config: 
        from_attributes = True

class DdsArticle(DdsArticleBase):
    id: int
    children: List['DdsArticle'] = []
    class Config:
        from_attributes = True
DdsArticle.update_forward_refs() # Для Pydantic V1 и рекурсивных ссылок
# =========================================

# --- СХЕМЫ ДЛЯ СЧЕТОВ (Accounts) ---
class AccountBase(BaseModel):
    name: str
    account_type: str 
    currency: str 
    initial_balance: Decimal
    is_active: bool = True
    class Config:
        from_attributes = True

class AccountCreate(AccountBase):
    pass

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    account_type: Optional[str] = None
    currency: Optional[str] = None
    is_active: Optional[bool] = None
    class Config:
        from_attributes = True

class Account(AccountBase):
    id: int
    current_balance: Decimal 
    class Config:
        from_attributes = True
# ===================================

# --- СХЕМЫ ДЛЯ ТРАНЗАКЦИЙ (Transactions) ---
# Важно: Схемы, используемые в Transaction (Account, DdsArticle, UserBase/User) должны быть определены ВЫШЕ
class TransactionBase(BaseModel):
    transaction_date: date
    amount: Decimal
    description: Optional[str] = None
    contractor: Optional[str] = None
    employee: Optional[str] = None 
    class Config:
        from_attributes = True

class TransactionCreate(BaseModel):
    transaction_date: date
    amount: Decimal
    description: Optional[str] = None
    contractor: Optional[str] = None
    employee: Optional[str] = None
    account_id: int 
    dds_article_id: int 

class TransactionCategoryUpdate(BaseModel):
    dds_article_id: int              
    description: Optional[str] = None 
    contractor: Optional[str] = None  
    class Config: # Добавляем на случай, если где-то понадобится orm_mode
        from_attributes = True

class TransactionUpdate(BaseModel): # Схема для полного обновления
    transaction_date: Optional[date] = None
    amount: Optional[Decimal] = None
    description: Optional[str] = None
    contractor: Optional[str] = None
    employee: Optional[str] = None
    account_id: Optional[int] = None
    dds_article_id: Optional[int] = None
    class Config:
        from_attributes = True

class Transaction(TransactionBase):
    id: int
    created_at: datetime 
    updated_at: datetime 
    account: Optional[Account] = None 
    dds_article: Optional[DdsArticle] = None 
    created_by: Optional[UserBase] = None # Используем UserBase для избежания глубокой рекурсии с полной схемой User

    class Config:
        from_attributes = True

# Схема для ответа с пагинацией транзакций
class TransactionsPageResponse(BaseModel):
    items: List[Transaction]
    total_count: int
    class Config: 
        from_attributes = True
# =======================================

# --- СХЕМЫ ДЛЯ ОТЧЕТОВ И ДАШБОРДА ---
class ReportLineItem(BaseModel):
    article_id: int
    article_name: str
    article_parent_id: Optional[int] = None
    total_amount: Decimal
    class Config:
        from_attributes = True

class DDSReportData(BaseModel):
    start_date: date
    end_date: date
    income_items: List[ReportLineItem]
    total_income: Decimal
    expense_items: List[ReportLineItem]
    total_expenses: Decimal
    net_cash_flow: Decimal
    # opening_balance: Optional[Decimal] = None # Для будущего расширения отчета ДДС
    # closing_balance: Optional[Decimal] = None # Для будущего расширения отчета ДДС
    class Config:
        from_attributes = True # Если части будут из ORM

class AccountBalanceItem(BaseModel):
    account_id: int
    account_name: str
    account_type: str
    currency: str
    current_balance: Decimal
    class Config:
        from_attributes = True

class AccountBalancesReportData(BaseModel):
    report_date: date 
    balances: List[AccountBalanceItem]
    total_balances_by_currency: Dict[str, Decimal]
    class Config:
        from_attributes = True

class DashboardKPIs(BaseModel):
    total_balances_by_currency: Dict[str, Decimal]
    total_income_last_30_days: Decimal
    total_expenses_last_30_days: Decimal
    net_cash_flow_last_30_days: Decimal
    class Config:
        from_attributes = True # Если данные будут приходить напрямую из ORM-like структур

class DailyCashFlow(BaseModel):
    date: date
    total_income: Decimal
    total_expenses: Decimal
    class Config: 
        from_attributes = True

class CashFlowTrend(BaseModel):
    period_start_date: date
    period_end_date: date
    daily_flows: List[DailyCashFlow]
    class Config:
        from_attributes = True
# =====================================

# --- СХЕМЫ ДЛЯ ЗАГРУЗКИ ВЫПИСОК И ПАКЕТНОЙ КАТЕГОРИЗАЦИИ ---
class RawTransactionData(BaseModel): # Используется для передачи данных на фронт, не из ORM напрямую
    original_row_index: int
    transaction_date: date
    amount: Decimal
    description: str
    contractor: Optional[str] = None
    is_income: bool
    suggested_dds_article_id: Optional[int] = None 

class StatementUploadResponse(BaseModel): # Используется для ответа API, не из ORM напрямую
    message: str
    created_transactions_auto: int
    transactions_for_review: List[RawTransactionData]
    failed_rows: int
    skipped_duplicates_count: int

class CategorizedTransactionData(BaseModel): # Приходит с фронта, не из ORM
    transaction_date: date
    amount: Decimal
    description: Optional[str] = None
    contractor: Optional[str] = None
    account_id: int
    dds_article_id: int
    # employee: Optional[str] = None # Если нужно будет передавать с фронта

class BatchCategorizeRequest(BaseModel): # Приходит с фронта
    transactions: List[CategorizedTransactionData]

class BatchCategorizeResponse(BaseModel): # Ответ API
    message: str
    successfully_created: int
    failed_to_create: int
# ======================================================

# --- СХЕМЫ ДЛЯ ТОКЕНОВ (не менялись) ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None