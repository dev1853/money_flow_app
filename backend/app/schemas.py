# backend/app/schemas.py

from pydantic import BaseModel, EmailStr, Field
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

    class Config:
        orm_mode = True

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

    class Config:
        orm_mode = True

# --- Account Schemas ---
class AccountBase(BaseModel):
    name: str
    account_type: str
    currency: str
    is_active: bool = True
    initial_balance: float = 0.0
    current_balance: float = 0.0    

    class Config:
        orm_mode = True # Changed from from_attributes=True to match existing codebase (assuming Pydantic V1)

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
    
    class Config:
        orm_mode = True # Changed from from_attributes=True to match existing codebase (assuming Pydantic V1)

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
    children: List['DdsArticle'] # Если нужна рекурсивная связь, раскомментируйте
    
    class Config:
        orm_mode = True
        
DdsArticle.update_forward_refs()

# --- Transaction Schemas ---
class TransactionBase(BaseModel):
    date: date
    amount: float
    description: Optional[str] = None
    account_id: int
    dds_article_id: Optional[int] = None
    transaction_type: TransactionType

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

    class Config:
        orm_mode = True

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

class DdsReportItem(BaseModel):
    article_id: int
    article_name: str
    parent_id: Optional[int] = None
    income: float
    expense: float
    initial_balance: float
    final_balance: float
    children: List['DdsReportItem'] = []

    class Config:
        orm_mode = True # Changed from from_attributes=True to match existing codebase (assuming Pydantic V1)
DdsReportItem.update_forward_refs()

# Схема для отчета по балансам
class AccountBalance(BaseModel):
    account_id: int
    account_name: str
    balance: float

    class Config:
        orm_mode = True

class DashboardCashflowTrendData(BaseModel):
    event_date: date = Field(..., description="Дата для точки данных тренда")
    income: float = Field(..., description="Сумма доходов за эту дату")
    expense: float = Field(..., description="Сумма расходов за эту дату")

class DashboardSummaryData(BaseModel):
    total_income: float
    total_expense: float
    net_profit: float

# --- НОВАЯ СХЕМА ДЛЯ ОТЧЕТА О ПРИБЫЛЯХ И УБЫТКАХ ---
class ProfitLossReport(BaseModel):
    total_income: float
    total_expense: float
    net_profit: float
    # Можно добавить детализацию, если ОПиУ будет иметь статьи
    # например, by_article_type: Dict[str, float] = {}

# --- СХЕМЫ ДЛЯ MappingRule ---
class MappingRuleBase(BaseModel):
    keyword: str = Field(..., min_length=1, max_length=255, description="Ключевое слово для автоматического разнесения")
    dds_article_id: int = Field(..., description="ID статьи ДДС, к которой относится правило")
    transaction_type: Optional[TransactionType] = Field(None, description="Тип транзакции (income/expense), к которому применяется правило. Null для обоих.")
    priority: int = Field(0, description="Приоритет правила (чем выше, тем раньше применяется)")
    is_active: bool = Field(True, description="Активно ли правило")

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
    
    class Config:
        orm_mode = True
        
class MappingRulePage(BaseModel):
    items: List[MappingRule]
    total_count: int

DdsReportItem.update_forward_refs()