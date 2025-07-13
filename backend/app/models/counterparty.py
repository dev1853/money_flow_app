# /backend/app/models/counterparty.py

from sqlalchemy import Column, Integer, String, Enum, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base
from .mixins import TimestampMixin
import enum

class CounterpartyType(str, enum.Enum):
    CLIENT = "client"
    SUPPLIER = "supplier"
    EMPLOYEE = "employee"
    OTHER = "other"

class Counterparty(Base, TimestampMixin):
    __tablename__ = "counterparties"

    id = Column(Integer, primary_key=True, index=True) 
    name = Column(String, nullable=False, index=True, comment="Название контрагента")
    type = Column(Enum(CounterpartyType), nullable=False, default=CounterpartyType.OTHER)
    
    inn = Column(String, nullable=True, unique=True, comment="ИНН")
    contact_person = Column(String, nullable=True, comment="Контактное лицо")
    contact_info = Column(String, nullable=True, comment="Контакты (телефон, email)")

    # ИСПРАВЛЕНИЕ: Добавляем owner_id и связь с моделью User
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    
    owner = relationship("User") # Связь с пользователем
    workspace = relationship("Workspace")
    transactions = relationship("Transaction", back_populates="counterparty")
    contracts = relationship("Contract", back_populates="counterparty", cascade="all, delete-orphan")