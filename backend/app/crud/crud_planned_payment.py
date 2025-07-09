# /backend/app/crud/crud_planned_payment.py

from sqlalchemy.orm import Session
from datetime import date
from typing import List
from sqlalchemy import or_, and_
from .base import CRUDBase
from ..models.planned_payment import PlannedPayment
from ..schemas.planned_payment import PlannedPaymentCreate, PlannedPaymentUpdate

class CRUDPlannedPayment(CRUDBase[PlannedPayment, PlannedPaymentCreate, PlannedPaymentUpdate]):
    
    # --- ДОБАВЛЕН НЕДОСТАЮЩИЙ МЕТОД ---
    def create_with_owner(
        self, db: Session, *, obj_in: PlannedPaymentCreate, owner_id: int, workspace_id: int
    ) -> PlannedPayment:
        """
        Создает запланированный платеж, добавляя ID владельца и воркспейса.
        """
        obj_in_data = obj_in.model_dump()
        db_obj = self.model(
            **obj_in_data, 
            owner_id=owner_id, 
            workspace_id=workspace_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi_by_workspace_and_period(
        self, 
        db: Session, 
        *, 
        workspace_id: int, 
        start_date: date, 
        end_date: date
    ) -> List[PlannedPayment]:
        """
        Получает все релевантные запланированные платежи для периода.
        """
        return db.query(self.model).filter(
            self.model.workspace_id == workspace_id,
            # Используем or_ для объединения двух основных условий
            or_(
                # Условие 1: Это не повторяющийся платеж И он попадает в наше окно
                and_(
                    self.model.is_recurring == False,
                    self.model.payment_date >= start_date,
                    self.model.payment_date <= end_date
                ),
                # Условие 2: Это повторяющийся платеж И он начался до конца нашего окна
                and_(
                    self.model.is_recurring == True,
                    self.model.payment_date <= end_date
                )
            )
        ).all()

# Создаем единственный экземпляр класса
planned_payment = CRUDPlannedPayment(PlannedPayment)