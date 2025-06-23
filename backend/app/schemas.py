# backend/app/schemas.py

from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional, Literal, Dict, Any, Union
from datetime import date, datetime

TransactionType = Literal["income", "expense"]

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    username: str
    is_active: bool = True
    is_superuser: bool = False
    full_name: Optional[str] = None
    active_workspace_id: Optional[int] = None

class UserCreate(UserBase):
    password: str
    role_id: int = 2

class UserUpdate(UserBase):
    pass

class User(UserBase):
    id: int
    # ИСПРАВЛЕНО: Заменен старый Config на model_config для Pydantic V2
    model_config = ConfigDict(from_attributes=True)

# --- Token Schema ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- Workspace Schemas ---
class WorkspaceBase(BaseModel):
    name: str

class WorkspaceCreate(WorkspaceBase):
    pass

class WorkspaceUpdate(WorkspaceBase):
    pass

class Workspace(WorkspaceBase):
    id: int
    owner_id: int
    # ИСПРАВЛЕНО: Заменен старый Config на model_config для Pydantic V2
    model_config = ConfigDict(from_attributes=True)

# --- Account Schemas ---
class AccountBase(BaseModel):
    name: str
    account_type: str
    currency: str
    is_active: bool = True
    initial_balance: float = 0.0
    current_balance: float = 0.0

class AccountCreate(AccountBase):
    workspace_id: int

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    account_type: Optional[str] = None
    currency: Optional[str] = None
    is_active: Optional[bool] = None
    initial_balance: Optional[float] = None
    current_balance: Optional[float] = None

class Account(AccountBase):
    id: int
    owner_id: int
    workspace_id: int
    # ИСПРАВЛЕНО: Удален дублирующий Config, оставлен только model_config
    model_config = ConfigDict(from_attributes=True)

# --- DDS Article Schemas ---
class DdsArticleBase(BaseModel):
    name: str
    code: Optional[str] = None
    type: Literal["income", "expense", "group"]
    parent_id: Optional[int] = None

class DdsArticleCreate(DdsArticleBase):
    workspace_id: int
    owner_id: int

class DdsArticleUpdate(DdsArticleBase):
    name: Optional[str] = None
    code: Optional[str] = None
    type: Optional[Literal["income", "expense", "group"]] = None
    parent_id: Optional[int] = None

class DdsArticle(DdsArticleBase):
    id: int
    workspace_id: int
    owner_id: int
    children: List['DdsArticle'] = []
    # ИСПРАВЛЕНО: Заменен старый Config на model_config для Pydantic V2
    model_config = ConfigDict(from_attributes=True)

# --- Transaction Schemas ---
class TransactionBase(BaseModel):
    date: datetime
    amount: float
    transaction_type: str
    account_id: int
    description: Optional[str] = None
    dds_article_id: Optional[int] = None
    # Эта конфигурация верна
    model_config = ConfigDict(from_attributes=True)

class TransactionCreate(TransactionBase):
    workspace_id: int
    owner_id: int

class TransactionUpdate(BaseModel):
    date: Optional[Union[date, str]] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    account_id: Optional[int] = None
    dds_article_id: Optional[int] = None
    transaction_type: Optional[Literal["income", "expense"]] = None

class Transaction(TransactionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    workspace_id: int
    owner_id: int
    account: Account
    dds_article: Optional[DdsArticle] = None
    # ИСПРАВЛЕНО: Удален дублирующий Config, оставлен только model_config
    model_config = ConfigDict(from_attributes=True)

class TransactionPage(BaseModel):
    items: List[Transaction]
    total_count: int

# --- Statement Schemas ---
class FailedRowDetail(BaseModel):
    row: Dict[str, Any]
    error: str

class StatementUploadResponse(BaseModel):
    created_transactions_auto: int
    failed_rows: int
    skipped_duplicates_count: int
    failed_row_details: List[FailedRowDetail]

# --- Report Schemas ---
class DdsReportItem(BaseModel):
    article_id: int
    article_name: str
    parent_id: Optional[int] = None
    income: float
    expense: float
    initial_balance: float
    final_balance: float
    children: List['DdsReportItem'] = []
    # ИСПРАВЛЕНО: Заменен старый Config на model_config для Pydantic V2
    model_config = ConfigDict(from_attributes=True)

class AccountBalance(BaseModel):
    account_id: int
    account_name: str
    balance: float
    # ИСПРАВЛЕНО: Заменен старый Config на model_config для Pydantic V2
    model_config = ConfigDict(from_attributes=True)

class DashboardCashflowTrendData(BaseModel):
    event_date: date
    income: float
    expense: float

class DashboardSummaryData(BaseModel):
    total_income: float
    total_expense: float
    net_profit: float

class ProfitLossReport(BaseModel):
    total_income: float
    total_expense: float
    net_profit: float

# --- MappingRule Schemas ---
class MappingRuleBase(BaseModel):
    keyword: str = Field(..., min_length=1, max_length=255)
    dds_article_id: int
    transaction_type: Optional[TransactionType] = None
    priority: int = 0
    is_active: bool = True

class MappingRuleCreate(MappingRuleBase):
    owner_id: int
    workspace_id: int

class MappingRuleUpdate(MappingRuleBase):
    keyword: Optional[str] = None
    dds_article_id: Optional[int] = None
    transaction_type: Optional[TransactionType] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None

class MappingRule(MappingRuleBase):
    id: int
    owner_id: int
    workspace_id: int
    created_at: datetime
    updated_at: datetime
    dds_article: DdsArticle
    # ИСПРАВЛЕНО: Заменен старый Config на model_config для Pydantic V2
    model_config = ConfigDict(from_attributes=True)

class MappingRulePage(BaseModel):
    items: List[MappingRule]
    total_count: int

# Обновляем ссылки для рекурсивных моделей в одном месте в конце файла
DdsArticle.update_forward_refs()
DdsReportItem.update_forward_refs()