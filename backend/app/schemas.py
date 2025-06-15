# backend/app/schemas.py
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from decimal import Decimal
from datetime import date, datetime
import enum

# --- Перечисление для типов транзакций ---
class TransactionType(str, enum.Enum):
    income = "income"
    expense = "expense"
    transfer = "transfer"

# --- СХЕМЫ ДЛЯ РОЛЕЙ (Roles) ---
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: Optional[Dict[str, Any]] = None

    class Config:
        orm_mode = True

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel): 
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[Dict[str, Any]] = None
    class Config:
        orm_mode = True

class Role(RoleBase):
    id: int

# --- СХЕМЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ (Users) ---
class UserBase(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    class Config:
        orm_mode = True

class UserCreate(UserBase):
    password: str
    role_id: int = 2
    is_active: bool = True

class User(UserBase): 
    id: int
    role_id: int 
    is_active: bool
    role: Optional[Role] = None

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None
    class Config:
        orm_mode = True

# --- СХЕМЫ ДЛЯ СТАТЕЙ ДДС (DDS Articles) ---
class DDSArticleBase(BaseModel):
    name: str
    description: Optional[str] = None
    type: str # 'income' или 'expense'
    parent_id: Optional[int] = None
    class Config:
        orm_mode = True

class DDSArticleCreate(DDSArticleBase):
    pass

class DDSArticleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    parent_id: Optional[int] = None
    class Config:
        orm_mode = True

class DDSArticle(DDSArticleBase):
    id: int
    workspace_id: int
    owner_id: int
    children: List['DDSArticle'] = []

# --- СХЕМЫ ДЛЯ СЧЕТОВ (Accounts) ---
class AccountBase(BaseModel):
    name: str
    currency: str
    initial_balance: Decimal = Field(default=0.0, max_digits=15, decimal_places=2)
    balance: Decimal = Field(default=0.0, max_digits=15, decimal_places=2)
    class Config:
        orm_mode = True

class AccountCreate(AccountBase):
    pass

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    currency: Optional[str] = None
    initial_balance: Optional[Decimal] = None
    class Config:
        orm_mode = True

class Account(AccountBase):
    id: int
    workspace_id: int
    owner_id: int
    transactions: List['Transaction'] = []

# --- СХЕМЫ ДЛЯ ТРАНЗАКЦИЙ (Transactions) ---
class TransactionBase(BaseModel):
    transaction_date: date
    amount: Decimal = Field(..., max_digits=15, decimal_places=2)
    currency: str
    description: Optional[str] = None
    transaction_type: TransactionType
    account_id: int
    dds_article_id: int
    related_account_id: Optional[int] = None
    related_transaction_id: Optional[int] = None

    class Config:
        orm_mode = True

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    transaction_date: Optional[date] = None
    amount: Optional[Decimal] = None
    currency: Optional[str] = None
    description: Optional[str] = None
    transaction_type: Optional[TransactionType] = None
    account_id: Optional[int] = None
    dds_article_id: Optional[int] = None
    related_account_id: Optional[int] = None
    class Config:
        orm_mode = True

class Transaction(TransactionBase):
    id: int
    workspace_id: int
    created_by_user_id: int
    created_at: datetime
    updated_at: datetime
    account: 'Account'
    dds_article: DDSArticle
    related_account: Optional['Account'] = None

# --- СХЕМЫ ДЛЯ РАБОЧИХ ПРОСТРАНСТВ (Workspaces) ---
class WorkspaceBase(BaseModel):
    name: str
    description: Optional[str] = None

class WorkspaceCreate(WorkspaceBase):
    pass

class Workspace(WorkspaceBase):
    id: int
    owner_id: int
    accounts: List[Account] = []
    dds_articles: List[DDSArticle] = []
    class Config:
        orm_mode = True

# --- СХЕМЫ ДЛЯ ПАГИНАЦИИ ---
class TransactionPage(BaseModel):
    items: List[Transaction]
    page: int
    size: int
    total: int
    class Config:
        orm_mode = True

# --- СХЕМЫ ДЛЯ ЗАГРУЗКИ ВЫПИСОК И ПАКЕТНОЙ КАТЕГОРИЗАЦИИ ---
class RawTransactionData(BaseModel):
    original_row_index: int
    transaction_date: date
    amount: Decimal
    description: str
    contractor: Optional[str] = None
    is_income: bool
    suggested_dds_article_id: Optional[int] = None 

class StatementUploadResponse(BaseModel):
    message: str
    created_transactions: int
    failed_rows: int
    skipped_duplicates_count: int
    failed_row_details: List[Dict[str, Any]]

class CategorizedTransactionData(BaseModel):
    transaction_date: date
    amount: Decimal
    description: Optional[str] = None
    contractor: Optional[str] = None
    account_id: int
    dds_article_id: int

class BatchCategorizeRequest(BaseModel):
    transactions: List[CategorizedTransactionData]

class BatchCategorizeResponse(BaseModel):
    message: str
    successfully_created: int
    failed_to_create: int

# --- СХЕМЫ ДЛЯ ТОКЕНОВ ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- СХЕМЫ ДЛЯ ОТЧЕТОВ ---
class DDSReportItem(BaseModel):
    article_id: int
    article_name: str
    article_type: str
    total_amount: Decimal
    children: List['DDSReportItem'] = []

class AccountBalance(BaseModel):
    account_id: int
    account_name: str
    currency: str
    balance: Decimal

# =========================================================
# --- ОБНОВЛЕНИЕ ПРЯМЫХ ССЫЛОК (Forward References) ---
# ИСПРАВЛЕНО: Используем правильный метод для Pydantic v1
# Этот блок должен идти в самом конце файла, после определения всех классов.
#=========================================================
Account.update_forward_refs(Transaction=Transaction)
DDSArticle.update_forward_refs(DDSArticle=DDSArticle)
Transaction.update_forward_refs(Account=Account)
DDSReportItem.update_forward_refs(DDSReportItem=DDSReportItem)