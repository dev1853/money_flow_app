# /backend/app/schemas/planned_payment.py

from __future__ import annotations 
from pydantic import BaseModel, Field, ConfigDict
from datetime import date
from decimal import Decimal
from typing import Optional

# Импортируем наш Enum из модели
from ..models.planned_payment import PaymentType
RecurrenceRule = str 

class PlannedPaymentBase(BaseModel):
    description: str = Field(..., min_length=1, description="Описание платежа")
    amount: Decimal = Field(..., gt=0, description="Сумма (должна быть положительной)")
    payment_date: date = Field(..., description="Планируемая дата")
    payment_type: PaymentType = Field(..., description="Тип: доход или расход")
    is_recurring: bool = Field(default=False, description="Является ли платеж повторяющимся")
    recurrence_rule: Optional[RecurrenceRule] = Field(None, description="Правило повторения (напр., 'monthly')")

class PlannedPaymentCreate(PlannedPaymentBase):
    pass

class PlannedPaymentUpdate(BaseModel):
    description: Optional[str] = Field(None, min_length=1)
    amount: Optional[Decimal] = Field(None, gt=0)
    payment_date: Optional[date] = None
    payment_type: Optional[PaymentType] = None
    is_recurring: Optional[bool] = None
    recurrence_rule: Optional[RecurrenceRule] = None

class PlannedPayment(PlannedPaymentBase):
    id: int
    workspace_id: int
    owner_id: int
    
    model_config = ConfigDict(from_attributes=True)