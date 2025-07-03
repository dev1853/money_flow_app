# /backend/app/models.py

import enum
from sqlalchemy import (
    Boolean, Column, Integer, String, DateTime, ForeignKey, Date, Text,
    UniqueConstraint, Numeric, Enum as SQLEnum, CheckConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy import func
from .database import Base
from .schemas import TransactionType

class Role(Base):
    __tablename__ = "roles"
    __table_args__ = {'extend_existing': True} 
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True} 
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
        primaryjoin="User.id == Workspace.owner_id" 
    )    
    accounts = relationship("Account", back_populates="owner")
    dds_articles = relationship("DdsArticle", back_populates="owner")
    transactions = relationship("Transaction", back_populates="owner", foreign_keys='[Transaction.created_by_user_id]') 
    mapping_rules = relationship("MappingRule", back_populates="owner")
    budgets = relationship("Budget", back_populates="owner")

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)


class Workspace(Base):
    __tablename__ = "workspaces"
    __table_args__ = {'extend_existing': True} 
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False) 
    currency = Column(String, nullable=False, default="RUB") 
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    owner = relationship("User", back_populates="workspaces", primaryjoin="User.id == Workspace.owner_id")
    accounts = relationship("Account", back_populates="workspace", cascade="all, delete-orphan")
    dds_articles = relationship("DdsArticle", back_populates="workspace", cascade="all, delete-orphan")
    mapping_rules = relationship("MappingRule", back_populates="workspace", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="workspace", cascade="all, delete-orphan", foreign_keys='[Transaction.workspace_id]') 
    budgets = relationship("Budget", back_populates="workspace", cascade="all, delete-orphan")


class Account(Base):
    __tablename__ = "accounts"
    __table_args__ = (
        # Добавляем CHECK constraint, чтобы баланс не мог быть отрицательным
        CheckConstraint('balance >= 0', name='check_account_balance_positive'),
        UniqueConstraint('name', 'workspace_id', name='_account_name_workspace_uc'),
        {'extend_existing': True}
    )
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    # Используем Numeric для денег - это ПРАВИЛЬНО
    balance = Column(Numeric(15, 2), nullable=False, default=0.0)
    currency = Column(String(3), nullable=False, default="RUB")
    is_active = Column(Boolean, default=True, nullable=False)
    
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)

    owner = relationship("User", back_populates="accounts")
    workspace = relationship("Workspace", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account")

class DdsArticle(Base):
    __tablename__ = "dds_articles"
    __table_args__ = {'extend_existing': True} 
    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("dds_articles.id"), nullable=True)
    name = Column(String, index=True)
    article_type = Column(String(10), nullable=False) 
    is_archived = Column(Boolean(), default=False)

    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    code = Column(String, nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    owner = relationship("User", back_populates="dds_articles")
    workspace = relationship("Workspace", back_populates="dds_articles")
    transactions = relationship("Transaction", back_populates="dds_article") 
    mapping_rules = relationship("MappingRule", back_populates="dds_article") 
    
    budget_items = relationship(
        "BudgetItem", 
        back_populates="dds_article",
        primaryjoin="DdsArticle.id == BudgetItem.dds_article_id" 
    ) 

class TransactionType(enum.Enum):
    income = "income"
    expense = "expense"

class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        # Сумма транзакции должна быть строго больше нуля
        CheckConstraint('amount > 0', name='check_transaction_amount_positive'),
        {'extend_existing': True}
    )
    id = Column(Integer, primary_key=True, index=True)
    transaction_date = Column(Date, nullable=False, index=True)
    # Используем Numeric для денег - это ПРАВИЛЬНО
    amount = Column(Numeric(15, 2), nullable=False)
    description = Column(String, nullable=True)
    transaction_type = Column(SQLEnum(TransactionType), nullable=False) # Используем Enum
    
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    dds_article_id = Column(Integer, ForeignKey("dds_articles.id"), nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)

    account = relationship("Account", back_populates="transactions")
    dds_article = relationship("DdsArticle")
    owner = relationship("User")
    workspace = relationship("Workspace")

class MappingRule(Base):
    __tablename__ = "mapping_rules"
    __table_args__ = {'extend_existing': True} 
    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String(255), nullable=False)
    dds_article_id = Column(Integer, ForeignKey("dds_articles.id"), nullable=False)
    transaction_type = Column(String(10), nullable=True) 
    priority = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean(), default=True)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    owner = relationship("User", back_populates="mapping_rules")
    workspace = relationship("Workspace", back_populates="mapping_rules")
    dds_article = relationship("DdsArticle", back_populates="mapping_rules") 

    __table_args__ = (UniqueConstraint('keyword', 'workspace_id', name='_keyword_workspace_uc'),)


class Budget(Base):
    __tablename__ = "budgets"
    __table_args__ = {'extend_existing': True} 
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

    __table_args__ = (UniqueConstraint('name', 'workspace_id', 'start_date', 'end_date', name='_budget_name_workspace_period_uc'),)


class BudgetItem(Base):
    __tablename__ = "budget_items"
    __table_args__ = {'extend_existing': True} 
    id = Column(Integer, primary_key=True, index=True)
    budget_id = Column(Integer, ForeignKey("budgets.id"), nullable=False)
    dds_article_id = Column(Integer, ForeignKey("dds_articles.id"), nullable=False)
    budgeted_amount = Column(Numeric(15, 2), nullable=False) 
    type = Column(String(10), nullable=False) 

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    budget = relationship("Budget", back_populates="budget_items")
    dds_article = relationship("DdsArticle", back_populates="budget_items") 

    __table_args__ = (UniqueConstraint('budget_id', 'dds_article_id', name='_budget_item_unique_article'),)