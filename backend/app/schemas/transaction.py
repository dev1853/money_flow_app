from __future__ import annotations # Важно для отложенных ссылок

from typing import Optional, List
from datetime import date
from pydantic import BaseModel, Field

from .base import BaseSchema
from .account import Account
from .dds_article import DdsArticle
from .counterparty import Counterparty
from .contract import Contract # Добавляем импорт для схемы Contract
from ..models.transaction import TransactionType

class TransactionBase(BaseSchema):
    description: Optional[str] = None
    amount: float = Field(..., gt=0)
    transaction_date: date
    # ИСПРАВЛЕНИЕ: Удаляем alias="type"
    transaction_type: TransactionType # Изменено с Field(..., alias="type")
    contract_id: Optional[int] = Field(None, description="ID договора") # Добавляем необязательное поле contract_id
    
class TransactionCreate(TransactionBase):
    from_account_id: Optional[int] = None
    to_account_id: Optional[int] = None
    user_id: Optional[int] = None       # ИСПРАВЛЕНИЕ: Сделано необязательным
    workspace_id: Optional[int] = None  # ИСПРАВЛЕНИЕ: Сделано необязательным
    dds_article_id: Optional[int] = None
    counterparty_id: Optional[int] = None
    # contract_id уже унаследовано от TransactionBase

# Добавляем недостающую схему TransactionUpdate
class TransactionUpdate(BaseSchema):
    description: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    transaction_date: Optional[date] = None
    transaction_type: Optional[TransactionType] # Изменено с Field(None, alias="type")
    from_account_id: Optional[int] = None
    to_account_id: Optional[int] = None
    dds_article_id: Optional[int] = None
    counterparty_id: Optional[int] = None
    contract_id: Optional[int] = Field(None, description="ID договора") # Добавляем необязательное поле contract_id

class TransactionInDB(TransactionBase):
    id: int
    from_account_id: Optional[int] = None
    to_account_id: Optional[int] = None
    user_id: int
    workspace_id: int
    dds_article_id: Optional[int] = None
    counterparty_id: Optional[int] = None
    # contract_id уже унаследовано от TransactionBase

class Transaction(TransactionInDB):
    from_account: Optional[Account] = None
    to_account: Optional[Account] = None
    user: Optional["User"] = None
    # workspace: Optional["Workspace"] = None # Эту строку вы уже удалили
    dds_article: Optional[DdsArticle] = None
    counterparty: Optional[Counterparty] = None
    contract: Optional[Contract] = None # Добавляем отношение к схеме Contract

# Добавляем недостающую схему TransactionPage
class TransactionPage(BaseModel):
    items: List[Transaction]
    total: int