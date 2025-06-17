from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import date

from .. import models

class CRUDReport:
    """
    Класс для генерации отчетов. Не наследуется от CRUDBase.
    """
    def get_dds_report(self, db: Session, *, owner_id: int, workspace_id: int, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        # Здесь должна быть ваша логика для генерации отчета ДДС
        # Это просто пример структуры
        return [{"article": "Example", "amount": 1000}]

# Создание экземпляра — просто и без аргументов
report = CRUDReport()