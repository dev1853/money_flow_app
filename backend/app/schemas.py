# backend/app/schemas.py

from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Literal, Dict, Any
from datetime import date, datetime

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    username: str
    is_active: bool = True
    is_superuser: bool = False
    full_name: Optional[str] = None

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
        from_attributes = True 

class AccountCreate(AccountBase):
    workspace_id: int

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    currency: Optional[str] = None
    is_active: Optional[bool] = None

class Account(AccountBase):
    id: int
    workspace_id: int

    class Config:
        orm_mode = True

# --- DdsArticle Schemas ---
class DdsArticleBase(BaseModel):
    name: str
    code: Optional[str] = None
    type: str 
    parent_id: Optional[int] = None

class DdsArticleCreate(DdsArticleBase):
    workspace_id: int
    owner_id: int

class DdsArticleUpdate(DdsArticleBase):
    pass

class DdsArticle(DdsArticleBase):
    id: int
    owner_id: int
    workspace_id: int
    children: List['DdsArticle'] = []

    class Config:
        orm_mode = True
        
DdsArticle.update_forward_refs()

class DashboardCashflowTrendData(BaseModel):
    event_date: date = Field(..., description="Дата для точки данных тренда") # <--- ИЗМЕНЕНО
    income: float = Field(..., description="Сумма доходов за эту дату")
    expense: float = Field(..., description="Сумма расходов за эту дату")
    net_flow: float = Field(..., description="Чистый денежный поток (доходы - расходы) за эту дату")

    class Config:
        from_attributes = True
        
# --- Transaction Schemas ---
TransactionType = Literal["income", "expense", "transfer"]

class TransactionBase(BaseModel):
    date: date
    description: Optional[str] = None
    amount: float
    transaction_type: TransactionType

class TransactionCreate(TransactionBase):
    account_id: int
    dds_article_id: Optional[int] = None

class TransactionUpdate(BaseModel):
    date: Optional[date] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    transaction_type: Optional[TransactionType] = None
    account_id: Optional[int] = None
    dds_article_id: Optional[int] = None

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

# Заменяем DdsReportEntry на правильную версию
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
        from_attributes = True

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
    net_flow: float = Field(..., description="Чистый денежный поток (доходы - расходы) за эту дату")

    class Config:
        from_attributes = True # 

class DdsReportEntry(BaseModel): 
    article_id: int = Field(..., description="ID статьи ДДС")
    article_name: str = Field(..., description="Название статьи ДДС")
    is_income: bool = Field(..., description="Признак: доход (true) или расход (false)")
    total_amount: float = Field(..., description="Сумма транзакций по этой статье за период")

    class Config:
        from_attributes = True 
        
    