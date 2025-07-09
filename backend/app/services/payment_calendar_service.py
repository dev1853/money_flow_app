# /backend/app/services/payment_calendar_service.py

from sqlalchemy.orm import Session
from datetime import date, timedelta
from decimal import Decimal
from collections import defaultdict
from typing import List, Dict
from dateutil.rrule import rrule, MONTHLY, WEEKLY, DAILY # Мощная библиотека для правил

from .. import crud, models
from ..models.planned_payment import PaymentType

class PaymentCalendarService:
    def generate_calendar(
        self,
        db: Session,
        *,
        workspace_id: int,
        start_date: date,
        end_date: date
    ) -> Dict:
        # 1. Получаем текущий остаток
        current_balance = crud.account.get_total_balance_by_workspace(db, workspace_id=workspace_id)

        # 2. Получаем все релевантные платежи (разовые и регулярные)
        planned_payments = crud.planned_payment.get_multi_by_workspace_and_period(
            db,
            workspace_id=workspace_id,
            start_date=start_date,
            end_date=end_date
        )

        # 3. Группируем платежи по датам, "раскрывая" регулярные
        daily_movements = defaultdict(lambda: {"income": Decimal(0), "expense": Decimal(0), "planned_payments": []})
        
        for payment in planned_payments:
            if not payment.is_recurring:
                # --- Обработка разовых платежей (как и раньше) ---
                if start_date <= payment.payment_date <= end_date:
                    daily_movements[payment.payment_date]["planned_payments"].append(payment)
                    if payment.payment_type == PaymentType.INCOME:
                        daily_movements[payment.payment_date]["income"] += payment.amount
                    else:
                        daily_movements[payment.payment_date]["expense"] += payment.amount
            else:
                # --- НОВАЯ ЛОГИКА: Обработка регулярных платежей ---
                freq_map = {
                    'monthly': MONTHLY,
                    'weekly': WEEKLY,
                    'daily': DAILY
                }
                # Пропускаем, если правило некорректно
                if payment.recurrence_rule not in freq_map:
                    continue

                # Генерируем все даты повторений в нашем окне
                occurrences = rrule(
                    freq=freq_map[payment.recurrence_rule],
                    dtstart=payment.payment_date,
                    until=end_date
                )
                
                for occurrence_date in occurrences:
                    # Убедимся, что сгенерированная дата не раньше начала нашего окна
                    if occurrence_date.date() >= start_date:
                        # Добавляем виртуальный платеж в нужный день
                        daily_movements[occurrence_date.date()]["planned_payments"].append(payment)
                        if payment.payment_type == PaymentType.INCOME:
                            daily_movements[occurrence_date.date()]["income"] += payment.amount
                        else:
                            daily_movements[occurrence_date.date()]["expense"] += payment.amount

        # 4. Строим прогноз по дням (этот код не меняется)
        calendar_data = []
        current_day_balance = current_balance
        
        for day_offset in range((end_date - start_date).days + 1):
            current_date = start_date + timedelta(days=day_offset)
            movements = daily_movements[current_date]
            balance_at_end_of_day = current_day_balance + movements["income"] - movements["expense"]

            calendar_data.append({
                "date": current_date,
                "balance_start": current_day_balance,
                "income": movements["income"],
                "expense": movements["expense"],
                "balance_end": balance_at_end_of_day,
                "is_cash_gap": balance_at_end_of_day < 0,
                "planned_payments": movements["planned_payments"],
            })
            current_day_balance = balance_at_end_of_day
            
        return {"start_balance": current_balance, "calendar_days": calendar_data, "end_balance": current_day_balance}


payment_calendar_service = PaymentCalendarService()