# /backend/app/models.py

from .database import Base
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Boolean,
    DECIMAL, CheckConstraint, Date, Numeric, Enum, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from decimal import Decimal as PythonDecimal
import enum

class Role(Base):
    __tablename__ = "roles"
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True} # Корректный синтаксис: словарь
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean(), default=True)
    is_superuser = Column(Boolean(), default=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    role = relationship("Role", back_populates="users")
    active_workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True)

    workspaces = relationship(
        "Workspace",
        back_populates="owner",
        primaryjoin="User.id == Workspace.owner_id",
    )
    accounts = relationship("Account", back_populates="owner")
    transactions = relationship("Transaction", back_populates="user")
    budgets = relationship("Budget", back_populates="owner")
    mapping_rules = relationship("MappingRule", back_populates="owner")

class Workspace(Base):
    __tablename__ = "workspaces"
    __table_args__ = {'extend_existing': True} # Корректный синтаксис: словарь
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="workspaces", primaryjoin="Workspace.owner_id == User.id")
    accounts = relationship("Account", back_populates="workspace")
    transactions = relationship("Transaction", back_populates="workspace")
    budgets = relationship("Budget", back_populates="workspace")
    mapping_rules = relationship("MappingRule", back_populates="workspace")
    dds_articles = relationship("DdsArticle", back_populates="workspace") 

class AccountType(Base):
    __tablename__ = "account_types"
    __table_args__ = {'extend_existing': True} # Корректный синтаксис: словарь
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    code = Column(String, unique=True, nullable=False)
    accounts = relationship("Account", back_populates="account_type_ref")
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

class DdsArticle(Base):
    __tablename__ = "dds_articles"
    __table_args__ = {'extend_existing': True} 
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    article_type = Column(String, nullable=False) 
    parent_id = Column(Integer, ForeignKey("dds_articles.id"), nullable=True)
    is_active = Column(Boolean(), default=True, nullable=False)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    parent = relationship("DdsArticle", remote_side=[id], back_populates="children")
    children = relationship("DdsArticle", back_populates="parent")
    workspace = relationship("Workspace", back_populates="dds_articles")
    budget_items = relationship("BudgetItem", back_populates="dds_article")
    mapping_rules = relationship("MappingRule", back_populates="dds_article")
    transactions = relationship(
        "Transaction",
        back_populates="dds_article",
        primaryjoin="DdsArticle.id == Transaction.dds_article_id" # Явное условие соединения
    )

class Account(Base):
    __tablename__ = "accounts"
    __table_args__ = {'extend_existing': True} 
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    balance = Column(Numeric(10, 2), default=PythonDecimal('0.0'))
    currency = Column(String(3), default="RUB")
    is_active = Column(Boolean(), default=True)
    account_type_id = Column(Integer, ForeignKey("account_types.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"))
    workspace_id = Column(Integer, ForeignKey("workspaces.id"))
    account_type_ref = relationship("AccountType", back_populates="accounts", lazy="joined")
    owner = relationship("User", back_populates="accounts")
    workspace = relationship("Workspace", back_populates="accounts")
    transactions_from = relationship("Transaction", foreign_keys=lambda: [Transaction.from_account_id], back_populates="from_account")
    transactions_to = relationship("Transaction", foreign_keys=lambda: [Transaction.to_account_id], back_populates="to_account")
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

class TransactionType(enum.Enum):
    INCOME = "INCOME"
    EXPENSE = "EXPENSE"
    TRANSFER = "TRANSFER"

class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        CheckConstraint('amount > 0', name='check_transaction_amount_positive'),
    )
    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, index=True)
    amount = Column(Numeric(15, 2), nullable=False)
    transaction_date = Column(Date, nullable=False, index=True)
    transaction_type = Column(Enum('INCOME', 'EXPENSE', 'TRANSFER', name='transactiontype'), nullable=False)
    from_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    to_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    workspace_id = Column(Integer, ForeignKey("workspaces.id"))
    dds_article_id = Column(Integer, ForeignKey("dds_articles.id"), nullable=True) # Пример
    from_account = relationship("Account", foreign_keys=lambda: [Transaction.from_account_id], back_populates="transactions_from")
    to_account = relationship("Account", foreign_keys=lambda: [Transaction.to_account_id], back_populates="transactions_to")
    user = relationship("User", foreign_keys=lambda: [Transaction.user_id], back_populates="transactions")
    workspace = relationship("Workspace", foreign_keys=lambda: [Transaction.workspace_id], back_populates="transactions")
    dds_article = relationship("DDSArticle")

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

class Budget(Base):
    __tablename__ = "budgets"
    __table_args__ = (UniqueConstraint('name', 'workspace_id', 'start_date', 'end_date', name='_budget_name_workspace_period_uc'),)
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    owner = relationship("User", back_populates="budgets")
    workspace = relationship("Workspace", back_populates="budgets")
    budget_items = relationship("BudgetItem", back_populates="budget", cascade="all, delete-orphan")

class BudgetItem(Base):
    __tablename__ = "budget_items"
    __table_args__ = (CheckConstraint('budgeted_amount > 0', name='check_budget_item_amount_positive'),)
    id = Column(Integer, primary_key=True, index=True)
    budget_id = Column(Integer, ForeignKey("budgets.id"), nullable=False)
    dds_article_id = Column(Integer, ForeignKey("dds_articles.id"), nullable=False)
    budgeted_amount = Column(Numeric(15, 2), nullable=False)
    type = Column(String(10), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    budget = relationship("Budget", back_populates="budget_items")
    dds_article = relationship("DdsArticle", back_populates="budget_items")
    
class MappingRule(Base):
    __tablename__ = "mapping_rules"
    __table_args__ = (UniqueConstraint('keyword', 'workspace_id', name='_keyword_workspace_uc'),)
    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String, nullable=False, index=True)
    dds_article_id = Column(Integer, ForeignKey("dds_articles.id"), nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    dds_article = relationship("DdsArticle", back_populates="mapping_rules")
    workspace = relationship("Workspace", back_populates="mapping_rules")
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True) 
    owner = relationship("User", back_populates="mapping_rules")