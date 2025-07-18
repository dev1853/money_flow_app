from fastapi import APIRouter, Depends, HTTPException
from app.schemas.bank import BankConnectionCreate, BankConnectionOut
from app.models.bank_connection import BankConnection
from sqlalchemy.orm import Session
from app.dependencies import get_db
from typing import List

router = APIRouter(prefix="/api/bank-integrations", tags=["Bank Integrations"])

@router.post("/connect", response_model=BankConnectionOut)
def connect_bank_connection(
    connection: BankConnectionCreate,
    db: Session = Depends(get_db),
):
    # TODO: Реализовать логику подключения к банку и сохранения токенов
    raise HTTPException(status_code=501, detail="Not implemented")

@router.get("/connections", response_model=List[BankConnectionOut])
def list_bank_connections(
    db: Session = Depends(get_db),
):
    # TODO: Получить список подключённых банков
    raise HTTPException(status_code=501, detail="Not implemented")

@router.get("/transactions/{connection_id}")
def get_bank_transactions(
    connection_id: int,
    db: Session = Depends(get_db),
):
    # TODO: Получить выписку по подключению
    raise HTTPException(status_code=501, detail="Not implemented") 