from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BankConnectionBase(BaseModel):
    bank: str

class BankConnectionCreate(BankConnectionBase):
    pass

class BankConnectionOut(BankConnectionBase):
    id: int
    user_id: int
    access_token: Optional[str]
    refresh_token: Optional[str]
    expires_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True 