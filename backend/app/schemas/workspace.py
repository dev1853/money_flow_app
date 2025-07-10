# schemas/workspace.py
from __future__ import annotations # Важно для отложенных ссылок

from typing import List, Optional
from pydantic import BaseModel, Field

from .base import BaseSchema
from .account import Account
from .budget import Budget
from .counterparty import Counterparty
from .dds_article import DdsArticle
from .mapping_rule import MappingRule
from .transaction import Transaction

class WorkspaceBase(BaseSchema):
    name: str

class WorkspaceCreate(WorkspaceBase):
    owner_id: int

# Добавляем недостающую схему WorkspaceUpdate
class WorkspaceUpdate(BaseSchema):
    name: Optional[str] = None

class WorkspaceInDB(WorkspaceBase):
    id: int
    owner_id: int

class Workspace(WorkspaceInDB):
    owner: Optional["User"] = None # Отложенная ссылка
    accounts: List[Account] = []
    budgets: List[Budget] = []
    counterparties: List[Counterparty] = []
    dds_articles: List[DdsArticle] = []
    mapping_rules: List[MappingRule] = []
    transactions: List[Transaction] = []

# УДАЛИТЕ все вызовы model_rebuild() отсюда. Они будут в __init__.py
# Workspace.model_rebuild()