# backend/app/models.py

from sqlalchemy import Boolean, Column, Integer, String, DateTime, Float, ForeignKey, Date, Text
from sqlalchemy.orm import relationship
from .database import Base
import datetime

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean(), default=True)
    is_superuser = Column(Boolean(), default=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    role = relationship("Role", back_populates="users")
    workspaces = relationship("Workspace", back_populates="owner")
    accounts = relationship("Account", back_populates="owner")
    dds_articles = relationship("DdsArticle", back_populates="owner")
    transactions = relationship("Transaction", back_populates="owner")
    # НОВОЕ: Связь с MappingRule
    mapping_rules = relationship("MappingRule", back_populates="owner", cascade="all, delete-orphan")

class Workspace(Base):
    __tablename__ = "workspaces"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    currency = Column(String, nullable=False, default="USD")
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="workspaces")
    accounts = relationship("Account", back_populates="workspace", cascade="all, delete-orphan")
    dds_articles = relationship("DdsArticle", back_populates="workspace", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="workspace", cascade="all, delete-orphan")
    # НОВОЕ: Связь с MappingRule
    mapping_rules = relationship("MappingRule", back_populates="workspace", cascade="all, delete-orphan")

class Account(Base):
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    initial_balance = Column(Float, nullable=False, default=0.0)
    current_balance = Column(Float, nullable=False, default=0.0)
    currency = Column(String, nullable=False, default="USD")
    is_active = Column(Boolean(), default=True)
    account_type = Column(String)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"))
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    workspace = relationship("Workspace", back_populates="accounts")
    owner = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account", cascade="all, delete-orphan")

class DdsArticle(Base):
    __tablename__ = "dds_articles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    code = Column(String, nullable=True, index=True)
    type = Column(String, nullable=False)
    parent_id = Column(Integer, ForeignKey("dds_articles.id"), nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"))
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    workspace = relationship("Workspace", back_populates="dds_articles")
    owner = relationship("User", back_populates="dds_articles")
    parent = relationship("DdsArticle", remote_side=[id], back_populates="children")
    children = relationship("DdsArticle", back_populates="parent", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="dds_article", cascade="all, delete-orphan")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    account = relationship("Account", back_populates="transactions")
    dds_article_id = Column(Integer, ForeignKey("dds_articles.id"), nullable=True)
    dds_article = relationship("DdsArticle")
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    owner = relationship("User", back_populates="transactions")
    workspace = relationship("Workspace", back_populates="transactions")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    transaction_type = Column(String, nullable=False)
    
class MappingRule(Base):
    __tablename__ = "mapping_rules"
    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String, nullable=False, unique=True, index=True) # Ключевое слово для сопоставления
    dds_article_id = Column(Integer, ForeignKey("dds_articles.id"), nullable=False)
    transaction_type = Column(String, nullable=True) # 'income', 'expense', или null для обоих
    priority = Column(Integer, default=0, nullable=False) # Приоритет правила
    is_active = Column(Boolean(), default=True, nullable=False) # Активно ли правило

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)

    # Связи с другими моделями
    dds_article = relationship("DdsArticle") # Обратная связь не нужна, т.к. статья может быть связана со многими правилами
    owner = relationship("User", back_populates="mapping_rules")
    workspace = relationship("Workspace", back_populates="mapping_rules")

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)