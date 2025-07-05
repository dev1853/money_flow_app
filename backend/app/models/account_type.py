# app/models/account_type.py
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from ..database import Base
from .mixins import TimestampMixin

class AccountType(Base, TimestampMixin):
    __tablename__ = "account_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    code = Column(String, unique=True, nullable=False)

    accounts = relationship("Account", back_populates="account_type_ref")