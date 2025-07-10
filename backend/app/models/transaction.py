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
from .counterparty import Counterparty 

class TransactionType(str, enum.Enum):
    INCOME = "INCOME"
    EXPENSE = "EXPENSE"
    TRANSFER = "TRANSFER"

class Transaction(Base, TimestampMixin):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    transaction_date = Column(Date, nullable=False, index=True)
    transaction_type = Column(SQLAlchemyEnum(TransactionType), nullable=False)

    from_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    to_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    dds_article_id = Column(Integer, ForeignKey("dds_articles.id"), nullable=True)

    counterparty_id = Column(Integer, ForeignKey("counterparties.id"), nullable=True, index=True)

    # --- Связи (relationships) ---
    # ИСПРАВЛЕНИЕ: Переименовано owner в user, чтобы соответствовать back_populates в User модели
    user = relationship("User") # Изменено с 'owner' на 'user'
    workspace = relationship("Workspace")
    from_account = relationship("Account", foreign_keys=[from_account_id])
    to_account = relationship("Account", foreign_keys=[to_account_id])
    dds_article = relationship("DdsArticle")
    counterparty = relationship("Counterparty", back_populates="transactions")

    __table_args__ = (
        CheckConstraint('amount > 0', name='check_transaction_amount_positive'),
    )