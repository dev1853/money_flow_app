# app/models.py
from sqlalchemy import (
    Column, Integer, String, Boolean, ForeignKey, Numeric, Date, DateTime, func, JSON
)
from sqlalchemy.orm import relationship
from .database import Base
from sqlalchemy.dialects.postgresql import JSONB

# --- Новая модель Workspace ---
class Workspace(Base):
    __tablename__ = "workspaces"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, default='Мое рабочее пространство')

    users = relationship("User", back_populates="workspace")
    dds_articles = relationship("DdsArticle", back_populates="workspace")
    accounts = relationship("Account", back_populates="workspace")
    transactions = relationship("Transaction", back_populates="workspace")
    # Если у тебя есть модели для Counterparty и Project, добавь их сюда
    # counterparties = relationship("Counterparty", back_populates="workspace")
    # projects = relationship("Project", back_populates="workspace")

    def __repr__(self):
        return f"<Workspace(id={self.id}, name='{self.name}')>"


class DdsArticle(Base):
    __tablename__ = "dds_articles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    article_type = Column(String, nullable=False) # "income" или "expense"
    is_archived = Column(Boolean, default=False, nullable=False)
    
    parent_id = Column(Integer, ForeignKey("dds_articles.id"), nullable=True)
    
    # Добавляем внешний ключ к Workspace
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    workspace = relationship("Workspace", back_populates="dds_articles")

    children = relationship(
        "DdsArticle", 
        back_populates="parent", 
        cascade="all, delete-orphan",
        order_by="DdsArticle.name"
    )
    parent = relationship(
        "DdsArticle", 
        remote_side=[id], 
        back_populates="children"
    )
    transactions = relationship("Transaction", back_populates="dds_article")


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    account_type = Column(String, nullable=False)
    currency = Column(String(3), nullable=False, default='RUB')
    initial_balance = Column(Numeric(15, 2), nullable=False, default=0.00)
    current_balance = Column(Numeric(15, 2), nullable=False) 
    is_active = Column(Boolean, default=True, nullable=False)

    # Добавляем внешний ключ к Workspace
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    workspace = relationship("Workspace", back_populates="accounts")

    transactions = relationship("Transaction", back_populates="account")

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    permissions = Column(JSONB, nullable=True, default={})

    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    
    # Добавляем внешний ключ к Workspace
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True) # nullable=True временно для миграций
    workspace = relationship("Workspace", back_populates="users")

    username = Column(String, nullable=False, unique=True, index=True)
    email = Column(String, nullable=False, unique=True, index=True)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    role = relationship("Role", back_populates="users")
    transactions = relationship("Transaction", back_populates="created_by")

class Transaction(Base):
    __tablename__ = "transactions" # Должна быть только одна такая строка для имени таблицы
    id = Column(Integer, primary_key=True, index=True)
    transaction_date = Column(Date, nullable=False, index=True)
    amount = Column(Numeric(15, 2), nullable=False)
    description = Column(String, nullable=True)
    contractor = Column(String, nullable=True)
    employee = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    dds_article_id = Column(Integer, ForeignKey("dds_articles.id"), nullable=False, index=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Добавляем внешний ключ к Workspace
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    workspace = relationship("Workspace", back_populates="transactions") # Убедись, что это отдельная строка

    account = relationship("Account", back_populates="transactions")
    dds_article = relationship("DdsArticle", back_populates="transactions")
    created_by = relationship("User", back_populates="transactions") # Эта строка должна быть отдельной
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    transaction_date = Column(Date, nullable=False, index=True)
    amount = Column(Numeric(15, 2), nullable=False)
    description = Column(String, nullable=True)
    contractor = Column(String, nullable=True)
    employee = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    dds_article_id = Column(Integer, ForeignKey("dds_articles.id"), nullable=False, index=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Добавляем внешний ключ к Workspace
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    workspace = relationship("Workspace", back_populates="transactions")

    account = relationship("Account", back_populates="transactions")
    dds_article = relationship("DdsArticle", back_populates="transactions")
    created_by = relationship("User", back_populates="transactions")    
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    transaction_date = Column(Date, nullable=False, index=True) # Добавил index=True
    amount = Column(Numeric(15, 2), nullable=False)
    description = Column(String, nullable=True) # nullable=True
    contractor = Column(String, nullable=True)  # nullable=True
    employee = Column(String, nullable=True)    # nullable=True
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True) # Добавил index=True
    dds_article_id = Column(Integer, ForeignKey("dds_articles.id"), nullable=False, index=True) # Добавил index=True
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Сделал nullable, если пользователь может быть удален

    account = relationship("Account", back_populates="transactions")
    dds_article = relationship("DdsArticle", back_populates="transactions")
    created_by = relationship("User", back_populates="transactions")