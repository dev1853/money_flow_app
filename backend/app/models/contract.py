from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey, Text, Enum as SQLAlchemyEnum # ИСПРАВЛЕНИЕ: Импортируем Enum как SQLAlchemyEnum
from sqlalchemy.orm import relationship
from ..database import Base
from .mixins import TimestampMixin
import enum

class ContractStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"
    PENDING = "pending"

class Contract(Base, TimestampMixin):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True, comment="Название договора/проекта")
    description = Column(Text, nullable=True, comment="Описание договора/проекта")
    start_date = Column(Date, nullable=False, comment="Дата начала договора")
    end_date = Column(Date, nullable=True, comment="Дата окончания договора")
    value = Column(Float, nullable=True, comment="Сумма договора")
    status = Column(SQLAlchemyEnum(ContractStatus), nullable=False, default=ContractStatus.ACTIVE, comment="Статус договора") # ИСПРАВЛЕНИЕ: Используем SQLAlchemyEnum

    counterparty_id = Column(Integer, ForeignKey("counterparties.id", ondelete="CASCADE"), nullable=False, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    counterparty = relationship("Counterparty", back_populates="contracts")
    workspace = relationship("Workspace")
    transactions = relationship("Transaction", back_populates="contract")