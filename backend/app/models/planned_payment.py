# /backend/app/models/planned_payment.py (рекомендуется создать новый файл)

from sqlalchemy import Column, Integer, String, Boolean, Date, Numeric, Enum, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base
from .mixins import TimestampMixin
import enum

class PaymentType(str, enum.Enum):
    INCOME = "INCOME"
    EXPENSE = "EXPENSE"

class PlannedPayment(Base, TimestampMixin):
    __tablename__ = "planned_payments"

    id = Column(Integer, primary_key=True)
    description = Column(String, nullable=False, comment="Описание платежа")
    amount = Column(Numeric(10, 2), nullable=False, comment="Сумма платежа (всегда положительная)")
    payment_date = Column(Date, nullable=False, index=True, comment="Планируемая дата")
    payment_type = Column(Enum(PaymentType), nullable=False, comment="Тип: доход или расход")
    
    # Для будущих улучшений (пока не используем, но заложим основу)
    is_recurring = Column(Boolean, default=False, nullable=False)
    recurrence_rule = Column(String, nullable=True, comment="Правило повторения (напр., RRULE)")

    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    owner = relationship("User")
    workspace = relationship("Workspace")