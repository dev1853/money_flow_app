# app/models/account.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from decimal import Decimal as PythonDecimal

from ..database import Base
from .mixins import TimestampMixin
from .account_type import AccountType 

class Account(Base, TimestampMixin):
    __tablename__ = "accounts"

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
    
    transactions_from = relationship("Transaction", foreign_keys="Transaction.from_account_id", back_populates="from_account")
    transactions_to = relationship("Transaction", foreign_keys="Transaction.to_account_id", back_populates="to_account")