# /backend/app/schemas/counterparty.py

from __future__ import annotations 
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from ..models.counterparty import CounterpartyType

class CounterpartyBase(BaseModel):
    name: str = Field(..., min_length=1, description="Название контрагента")
    type: CounterpartyType = Field(default=CounterpartyType.OTHER, description="Тип контрагента")
    inn: Optional[str] = None
    contact_person: Optional[str] = None
    contact_info: Optional[str] = None

class CounterpartyCreate(CounterpartyBase):
    pass

class CounterpartyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    type: Optional[CounterpartyType] = None
    inn: Optional[str] = None
    contact_person: Optional[str] = None
    contact_info: Optional[str] = None

class Counterparty(CounterpartyBase):
    id: int
    workspace_id: int
    
    model_config = ConfigDict(from_attributes=True)