# /backend/app/schemas/statement.py

from __future__ import annotations 
from pydantic import BaseModel
from typing import List
from .transaction import Transaction

# --- СХЕМА, КОТОРАЯ ВЫЗЫВАЛА ОШИБКУ ---
class StatementUploadResponse(BaseModel):
    """
    Схема для ответа после успешной загрузки и обработки выписки.
    """
    message: str
    created_transactions_count: int
    created_transactions: List[Transaction]