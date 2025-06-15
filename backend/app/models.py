# backend/app/models.py
from sqlalchemy import (
    Column, Integer, String, Boolean, ForeignKey, Numeric, Date, DateTime, func
)
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False, default=2)
    is_active = Column(Boolean, default=True)

    role = relationship("Role", back_populates="users")
    workspaces = relationship("Workspace", back_populates="owner", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="created_by")

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    
    users = relationship("User", back_populates="role")

class Workspace(Base):
    __tablename__ = "workspaces"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    owner = relationship("User", back_populates="workspaces")
    accounts = relationship("Account", back_populates="workspace", cascade="all, delete-orphan")
    dds_articles = relationship("DDSArticle", back_populates="workspace", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="workspace", cascade="all, delete-orphan")

class Account(Base):
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    currency = Column(String(3), nullable=False)
    initial_balance = Column(Numeric(15, 2), nullable=False, default=0)
    balance = Column(Numeric(15, 2), nullable=False, default=0)
    is_active = Column(Boolean, default=True) # <-- УБЕДИСЬ, ЧТО ЭТО ПОЛЕ ЗДЕСЬ

    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    workspace = relationship("Workspace", back_populates="accounts")
    transactions = relationship("Transaction", foreign_keys="[Transaction.account_id]", back_populates="account", cascade="all, delete-orphan")
    related_transactions = relationship("Transaction", foreign_keys="[Transaction.related_account_id]", back_populates="related_account", cascade="all, delete-orphan")

class DDSArticle(Base):
    __tablename__ = "dds_articles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    type = Column(String, nullable=False)  # 'income' или 'expense'
    parent_id = Column(Integer, ForeignKey("dds_articles.id"), nullable=True)
    
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    workspace = relationship("Workspace", back_populates="dds_articles")
    parent = relationship("DDSArticle", remote_side=[id], back_populates="children")
    children = relationship("DDSArticle", back_populates="parent", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="dds_article")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    transaction_date = Column(Date, nullable=False, index=True)
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(3), nullable=False)
    description = Column(String, nullable=True)
    transaction_type = Column(String, nullable=False) # 'income', 'expense', 'transfer'
    
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    dds_article_id = Column(Integer, ForeignKey("dds_articles.id"), nullable=False, index=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    related_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    related_transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True, unique=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    workspace = relationship("Workspace", back_populates="transactions")
    account = relationship("Account", foreign_keys=[account_id], back_populates="transactions")
    related_account = relationship("Account", foreign_keys=[related_account_id], back_populates="related_transactions")
    dds_article = relationship("DDSArticle", back_populates="transactions")
    created_by = relationship("User", back_populates="transactions")
    
    # Связь "один к одному" для переводов
    related_transaction = relationship("Transaction", remote_side=[id], uselist=False, post_update=True)