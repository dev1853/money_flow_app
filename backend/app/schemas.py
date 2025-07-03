# backend/app/schemas.py

import enum
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional, Literal, Dict, Any, Union
from datetime import date, datetime
from decimal import Decimal 

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
    password: Optional[str] = None 
    email: Optional[EmailStr] = None
    username: Optional[str] = None

class User(UserBase):
    id: int
    created_at: datetime 
    updated_at: datetime 
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
    name: Optional[str] = None

class Workspace(WorkspaceBase):
    id: int
    owner_id: int
    currency: str 
    created_at: datetime 
    updated_at: datetime 
    model_config = ConfigDict(from_attributes=True)

# --- Account Schemas ---
class AccountBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    currency: str = Field("RUB", min_length=3, max_length=3)
    balance: Decimal = Field(Decimal('0.0'), ge=Decimal('0.0'))
    is_active: bool = True
    workspace_id: int

class AccountCreate(AccountBase):
    pass 

class AccountUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    is_active: Optional[bool] = None


class Account(AccountBase):
    id: int
    owner_id: int
    
    model_config = ConfigDict(from_attributes=True)

# --- Dds Article Schemas ---
class DdsArticleBase(BaseModel):
    name: str
    code: Optional[str] = None
    article_type: Literal["income", "expense", "group"] 
    parent_id: Optional[int] = None
    is_archived: bool = False 

class DdsArticleCreate(DdsArticleBase): 
    pass

class DdsArticleUpdate(DdsArticleBase): 
    name: Optional[str] = None
    code: Optional[str] = None
    article_type: Optional[Literal["income", "expense", "group"]] = None
    parent_id: Optional[int] = None
    is_archived: Optional[bool] = None


class DdsArticleInDBBase(DdsArticleBase): 
    id: int
    owner_id: int
    workspace_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DdsArticle(DdsArticleInDBBase): 
    children: List["DdsArticle"] = [] 

# --- Transaction Schemas ---

class TransactionType(str, enum.Enum):
    income = "income"
    expense = "expense"
    
class TransactionBase(BaseModel):
    transaction_date: date
    amount: Decimal = Field(..., gt=Decimal('0.0'))
    description: Optional[str] = None
    transaction_type: TransactionType
    account_id: int
    dds_article_id: Optional[int] = None
    

class TransactionCreate(TransactionBase):
    pass 

class TransactionUpdate(BaseModel):
    transaction_date: Optional[date] = None
    amount: Optional[Decimal] = Field(None, gt=Decimal('0.0'))
    description: Optional[str] = None
    account_id: Optional[int] = None
    dds_article_id: Optional[int] = None

class Transaction(TransactionBase):
    id: int
    created_by_user_id: int
    workspace_id: int
    
    model_config = ConfigDict(from_attributes=True)
    
class TransactionPage(BaseModel):
    items: List[Transaction]
    total_count: int

    model_config = ConfigDict(from_attributes=True)

# --- Statement Schemas ---
class FailedRowDetail(BaseModel):
    row: Dict[str, Any]
    error: str

class StatementUploadResponse(BaseModel):
    created_transactions_auto: int
    failed_rows: int
    skipped_duplicates_count: int
    failed_row_details: List[FailedRowDetail]

    model_config = ConfigDict(from_attributes=True)


# --- Report Schemas ---

class DdsReportItem(BaseModel):
    article_id: Optional[int] = None
    article_name: str
    article_type: str
    amount: Decimal 
    children: List["DdsReportItem"] = [] 
    level: int = 0
    code: Optional[str] = None 

    model_config = ConfigDict(from_attributes=True)

class AccountBalance(BaseModel):
    account_id: int
    account_name: str
    balance: Decimal 

    model_config = ConfigDict(from_attributes=True)

class ProfitLossReport(BaseModel):
    start_date: date
    end_date: date
    total_income: Decimal = Field(default=Decimal('0.00')) 
    total_expense: Decimal = Field(default=Decimal('0.00')) 
    net_profit_loss: Decimal = Field(default=Decimal('0.00')) 

    model_config = ConfigDict(from_attributes=True)

# --- Dashboard Schemas ---
class SummaryItem(BaseModel):
    currency: str
    total_income: Decimal = Field(default=Decimal('0.00')) 
    total_expense: Decimal = Field(default=Decimal('0.00')) 
    net_balance: Decimal = Field(default=Decimal('0.00')) 

class DashboardSummaryData(BaseModel):
    start_date: date 
    end_date: date 
    summary_by_currency: List[SummaryItem] = []

    model_config = ConfigDict(from_attributes=True)

class DashboardCashflowTrendData(BaseModel):
    period: str 
    currency: str 
    total_income: Decimal = Field(default=Decimal('0.00')) 
    total_expense: Decimal = Field(default=Decimal('0.00')) 
    net_balance: Decimal = Field(default=Decimal('0.00')) 

    model_config = ConfigDict(from_attributes=True)


# --- Mapping Rule Schemas ---
class MappingRuleBase(BaseModel):
    keyword: str = Field(min_length=1, max_length=255)
    dds_article_id: int
    transaction_type: Optional[TransactionType] = None
    priority: int = 0
    is_active: bool = True

class MappingRuleCreate(MappingRuleBase):
    pass

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
    model_config = ConfigDict(from_attributes=True)

class MappingRulePage(BaseModel):
    items: List[MappingRule]
    total_count: int
    model_config = ConfigDict(from_attributes=True)


# --- НОВЫЕ СХЕМЫ ДЛЯ БЮДЖЕТИРОВАНИЯ ---
class BudgetItemBase(BaseModel):
    dds_article_id: int
    budgeted_amount: Decimal = Field(..., gt=Decimal('0.0'))

class BudgetItemCreate(BudgetItemBase):
    pass

class BudgetItemUpdate(BudgetItemBase):
    pass

class BudgetItemInDBBase(BudgetItemBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class BudgetItemSchema(BudgetItemInDBBase):
    dds_article: Optional["DdsArticle"] 


# --- Схемы для Budget ---
class BudgetBase(BaseModel):
    name: str
    start_date: date
    end_date: date

class BudgetCreate(BudgetBase):
    items: List[BudgetItemCreate]

class BudgetUpdate(BudgetBase):
    pass

class BudgetInDBBase(BudgetBase):
    id: int
    owner_id: int
    workspace_id: int
    created_at: datetime 
    updated_at: datetime 

    model_config = ConfigDict(from_attributes=True)

class BudgetSchema(BudgetInDBBase):
    items: List[BudgetItemSchema] = []


# Обновим forward_refs в конце файла
try:
    DdsArticle.update_forward_refs() 
    DdsArticleCreate.update_forward_refs() 
    BudgetSchema.update_forward_refs()
    BudgetItemSchema.update_forward_refs()
    DdsReportItem.update_forward_refs()
    MappingRule.update_forward_refs() 
    DdsArticle.update_forward_refs(Account=Account) # Добавляем Account
    Transaction.update_forward_refs(Account=Account, DdsArticle=DdsArticle) # Добавляем Transaction
except (NameError, TypeError):
    pass