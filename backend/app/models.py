# app/models.py
from sqlalchemy import (
    Column, Integer, String, Boolean, ForeignKey, Numeric, Date, DateTime, func, JSON
)
from sqlalchemy.orm import relationship
from .database import Base
from sqlalchemy.dialects.postgresql import JSONB # Предпочтительнее для PostgreSQL

class DdsArticle(Base):
    __tablename__ = "dds_articles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    article_type = Column(String, nullable=False) # "income" или "expense"
    is_archived = Column(Boolean, default=False, nullable=False)
    
    parent_id = Column(Integer, ForeignKey("dds_articles.id"), nullable=True) # nullable=True для корневых статей
    
    # Для иерархии: один ко многим (один родитель - много детей)
    children = relationship(
        "DdsArticle", 
        back_populates="parent", 
        cascade="all, delete-orphan", # Если удаляем родителя, удаляем и детей
        order_by="DdsArticle.name" # Сортировка детей по имени
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
    account_type = Column(String, nullable=False) # например, "bank_account", "cash_box"
    currency = Column(String(3), nullable=False, default='RUB')
    initial_balance = Column(Numeric(15, 2), nullable=False, default=0.00)
    current_balance = Column(Numeric(15, 2), nullable=False) 
    is_active = Column(Boolean, default=True, nullable=False)

    transactions = relationship("Transaction", back_populates="account")

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    permissions = Column(JSONB, nullable=True, default={}) # Используем JSONB

    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    username = Column(String, nullable=False, unique=True, index=True) # Добавил index=True
    email = Column(String, nullable=False, unique=True, index=True)    # Добавил index=True
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=True) # nullable=True
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    role = relationship("Role", back_populates="users")
    transactions = relationship("Transaction", back_populates="created_by")


class Transaction(Base):
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