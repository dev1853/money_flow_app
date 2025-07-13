# backend/app/schemas/contract.py

from __future__ import annotations
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List # Добавлен List
from datetime import date
from ..models.contract import ContractStatus
from .counterparty import Counterparty # Убедитесь, что Counterparty импортирован

class ContractBase(BaseModel):
    name: str = Field(..., min_length=1, description="Название договора/проекта")
    description: Optional[str] = Field(None, description="Описание договора/проекта")
    start_date: date = Field(..., description="Дата начала договора")
    end_date: Optional[date] = Field(None, description="Дата окончания договора")
    value: Optional[float] = Field(None, description="Сумма договора")
    status: ContractStatus = Field(default=ContractStatus.ACTIVE, description="Статус договора")
    counterparty_id: int = Field(..., description="ID контрагента, связанного с договором")

class ContractCreate(ContractBase):
    pass

class ContractUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, description="Название договора/проекта")
    description: Optional[str] = Field(None, description="Описание договора/проекта")
    start_date: Optional[date] = Field(None, description="Дата начала договора")
    end_date: Optional[date] = Field(None, description="Дата окончания договора")
    value: Optional[float] = Field(None, description="Сумма договора")
    status: Optional[ContractStatus] = Field(None, description="Статус договора")
    counterparty_id: Optional[int] = Field(None, description="ID контрагента, связанного с договором")

class Contract(ContractBase):
    id: int
    workspace_id: int
    counterparty: Optional[Counterparty] = None # Связанный контрагент

    model_config = ConfigDict(from_attributes=True)

# НОВАЯ СХЕМА: Для пагинированного списка договоров
class ContractPage(BaseModel):
    items: List[Contract]
    total: int