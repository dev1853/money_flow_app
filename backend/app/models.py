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
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True) # Сделал nullable=True если роль может быть не сразу назначена
    role = relationship("Role", back_populates="users")
    workspaces = relationship("Workspace", back_populates="owner")
    accounts = relationship("Account", back_populates="owner") 
    dds_articles = relationship("DdsArticle", back_populates="owner") 
    transactions = relationship("Transaction", back_populates="owner") 

class Workspace(Base):
    __tablename__ = "workspaces"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    currency = Column(String, nullable=False, default="USD") # *** ЭТОТ СТОЛБЕЦ ДОЛЖЕН БЫТЬ ***
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="workspaces")
    accounts = relationship("Account", back_populates="workspace", cascade="all, delete-orphan")
    dds_articles = relationship("DdsArticle", back_populates="workspace", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="workspace", cascade="all, delete-orphan")

class Account(Base):
    __tablename__ = "accounts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    initial_balance = Column(Float, nullable=False, default=0.0) 
    current_balance = Column(Float, nullable=False, default=0.0) # *** ЭТОТ СТОЛБЕЦ ДОЛЖЕН БЫТЬ ***
    currency = Column(String, nullable=False, default="USD") # *** ЭТОТ СТОЛБЕЦ ДОЛЖЕН БЫТЬ ***
    is_active = Column(Boolean(), default=True) 
    account_type = Column(String)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"))
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False) # *** ЭТОТ СТОЛБЕЦ ДОЛЖЕН БЫТЬ ***
    workspace = relationship("Workspace", back_populates="accounts")
    owner = relationship("User", back_populates="accounts") 
    transactions = relationship("Transaction", back_populates="account", cascade="all, delete-orphan")

class DdsArticle(Base):
    __tablename__ = "dds_articles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    # is_income = Column(Boolean, nullable=False, default=False) 
    code = Column(String, nullable=True, index=True) 
    type = Column(String, nullable=False) 
    parent_id = Column(Integer, ForeignKey("dds_articles.id"), nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"))
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False) # *** ЭТОТ СТОЛБЕЦ ДОЛЖЕН БЫТЬ ***
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
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False) # *** ЭТОТ СТОЛБЕЦ ДОЛЖЕН БЫТЬ ***
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    owner = relationship("User", back_populates="transactions") 
    workspace = relationship("Workspace", back_populates="transactions")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    transaction_type = Column(String, nullable=False) 