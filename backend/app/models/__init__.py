# app/models/__init__.py

# Импортируем Base из файла, где он определен (укажите правильный путь)
from ..database import Base

# Импортируем все модели и Enum'ы для корректной работы SQLAlchemy
from .role import Role
from .user import User
from .workspace import Workspace
from .account_type import AccountType
from .account import Account
from .dds_article import DdsArticle
from .transaction import Transaction, TransactionType
from .budget import Budget
from .budget_item import BudgetItem
from .mapping_rule import MappingRule

# __all__ помогает статическим анализаторам и определяет публичный API пакета
__all__ = [
    "Base",
    "Role",
    "User",
    "Workspace",
    "AccountType",
    "Account",
    "DdsArticle",
    "Transaction",
    "TransactionType",
    "Budget",
    "BudgetItem",
    "MappingRule",
]