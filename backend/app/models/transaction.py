# app/models/transaction.py
import enum
from sqlalchemy import (
    Column, Integer, String, ForeignKey, Date, Numeric,
    CheckConstraint, Enum as SQLAlchemyEnum
)
from sqlalchemy.orm import relationship
from decimal import Decimal as PythonDecimal

from ..database import Base
from .mixins import TimestampMixin

class TransactionType(str, enum.Enum):
    INCOME = "INCOME"
    EXPENSE = "EXPENSE"
    TRANSFER = "TRANSFER"

class Transaction(Base, TimestampMixin):
    __tablename__ = "transactions"
    __table_args__ = (
        CheckConstraint('amount > 0', name='check_transaction_amount_positive'),
    )

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, index=True)
    amount = Column(Numeric(15, 2), nullable=False)
    transaction_date = Column(Date, nullable=False, index=True)
    transaction_type = Column(SQLAlchemyEnum(TransactionType, name="transactiontype"), nullable=False)
    
    from_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True) # <-- ИЗМЕНЕНИЕ ЗДЕСЬ
    to_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    workspace_id = Column(Integer, ForeignKey("workspaces.id"))
    dds_article_id = Column(Integer, ForeignKey("dds_articles.id"), nullable=True)

    from_account = relationship("Account", foreign_keys=[from_account_id], back_populates="transactions_from")
    to_account = relationship("Account", foreign_keys=[to_account_id], back_populates="transactions_to")
    user = relationship("User", foreign_keys=[user_id], back_populates="transactions")
    workspace = relationship("Workspace", back_populates="transactions")
    dds_article = relationship("DdsArticle", back_populates="transactions")