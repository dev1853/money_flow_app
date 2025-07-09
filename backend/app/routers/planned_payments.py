# /backend/app/routers/planned_payments.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError # Импортируем базовое исключение
from typing import List
from datetime import date

from .. import crud, models, schemas
from ..dependencies import get_db, get_current_active_user, get_current_active_workspace

router = APIRouter(
    tags=["planned-payments"],
    dependencies=[Depends(get_current_active_user)],
    responses={404: {"description": "Not found"}},
)

@router.put("/{payment_id}", response_model=schemas.PlannedPayment)
def update_planned_payment(
    *,
    db: Session = Depends(get_db),
    payment_id: int,
    payment_in: schemas.PlannedPaymentUpdate,
    current_workspace: models.Workspace = Depends(get_current_active_workspace),
):
    """
    Обновить запланированный платеж.
    """
    # 1. Получаем объект из базы
    payment = crud.planned_payment.get(db=db, id=payment_id)
    if not payment or payment.workspace_id != current_workspace.id:
        raise HTTPException(status_code=404, detail="Запланированный платеж не найден")

    # 2. Обновляем его поля в сессии (этот метод не возвращает объект, он просто меняет его)
    crud.planned_payment.update(db=db, db_obj=payment, obj_in=payment_in)

    try:
        # 3. Сохраняем все изменения в сессии в базу данных
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка базы данных при обновлении: {e}"
        )

    # 4. Возвращаем исходный объект 'payment'. После db.commit()
    # он будет содержать все актуальные данные.
    return payment

@router.post("/", response_model=schemas.PlannedPayment, status_code=status.HTTP_201_CREATED)
def create_planned_payment(
    *,
    db: Session = Depends(get_db),
    payment_in: schemas.PlannedPaymentCreate,
    current_user: models.User = Depends(get_current_active_user),
    current_workspace: models.Workspace = Depends(get_current_active_workspace),
):
    try:
        return crud.planned_payment.create_with_owner(
            db=db, obj_in=payment_in, owner_id=current_user.id, workspace_id=current_workspace.id
        )
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка базы данных при создании: {e}")


# Пример для delete
@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_planned_payment(
    *,
    db: Session = Depends(get_db),
    payment_id: int,
    current_workspace: models.Workspace = Depends(get_current_active_workspace),
):
    payment_to_delete = crud.planned_payment.get(db=db, id=payment_id)
    if not payment_to_delete or payment_to_delete.workspace_id != current_workspace.id:
        raise HTTPException(status_code=404, detail="Запланированный платеж не найден")
    
    try:
        crud.planned_payment.remove(db=db, id=payment_id)
        db.commit()
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка базы данных при удалении: {e}")

    return

# GET-эндпоинт можно оставить без изменений, так как он только читает данные
@router.get("/", response_model=List[schemas.PlannedPayment])
def read_planned_payments(
    db: Session = Depends(get_db),
    start_date: date = None,
    end_date: date = None,
    current_workspace: models.Workspace = Depends(get_current_active_workspace),
):
    # ... (код этого эндпоинта без изменений)
    if start_date and end_date:
        return crud.planned_payment.get_multi_by_workspace_and_period(db=db, workspace_id=current_workspace.id, start_date=start_date, end_date=end_date)
    return crud.planned_payment.get_multi_by_owner(db=db, owner_id=current_workspace.id)