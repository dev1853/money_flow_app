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
    role_id = Column(Integer, ForeignKey("roles.id")) # <--- Ключевая связь
    role = relationship("Role", back_populates="users")
    workspaces = relationship("Workspace", back_populates="owner")

class Workspace(Base):
    __tablename__ = "workspaces"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="workspaces")
    accounts = relationship("Account", back_populates="workspace", cascade="all, delete-orphan")
    dds_articles = relationship("DDSArticle", back_populates="workspace", cascade="all, delete-orphan")

class Account(Base):
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    currency = Column(String(3))
    current_balance = Column(Float, default=0.0)
    owner_id = Column(Integer, ForeignKey("users.id"))
    workspace_id = Column(Integer, ForeignKey("workspaces.id"))
    workspace = relationship("Workspace", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account", cascade="all, delete-orphan")
    is_active = Column(Boolean(), default=True)

class DDSArticle(Base):
    __tablename__ = "dds_articles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    type = Column(String) # 'income' или 'expense'
    owner_id = Column(Integer, ForeignKey("users.id"))
    workspace_id = Column(Integer, ForeignKey("workspaces.id"))
    workspace = relationship("Workspace", back_populates="dds_articles")
    parent_id = Column(Integer, ForeignKey("dds_articles.id"), nullable=True)
    parent = relationship("DDSArticle", remote_side=[id], back_populates="children")
    children = relationship("DDSArticle", back_populates="parent", cascade="all, delete-orphan")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    account = relationship("Account", back_populates="transactions")
    dds_article_id = Column(Integer, ForeignKey("dds_articles.id"), nullable=True)
    dds_article = relationship("DDSArticle")
    created_by_user_id = Column(Integer, ForeignKey("users.id"))
    workspace_id = Column(Integer, ForeignKey("workspaces.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    transaction_type = Column(String, nullable=False)

class Report(Base):
    __tablename__ = 'reports'
    id = Column(Integer, primary_key=True)
    file_path = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    owner_id = Column(Integer, ForeignKey('users.id'))