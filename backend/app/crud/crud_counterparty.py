# /backend/app/crud/crud_counterparty.py

from sqlalchemy.orm import Session
from typing import List

from .base import CRUDBase
from ..models.counterparty import Counterparty
from ..schemas.counterparty import CounterpartyCreate, CounterpartyUpdate

class CRUDCounterparty(CRUDBase[Counterparty, CounterpartyCreate, CounterpartyUpdate]):
    def get_multi_by_workspace(
        self, db: Session, *, workspace_id: int, skip: int = 0, limit: int = 100
    ) -> List[Counterparty]:
        """
        Получает список контрагентов для указанного рабочего пространства.
        """
        return (
            db.query(self.model)
            .filter(self.model.workspace_id == workspace_id)
            .order_by(self.model.name)
            .offset(skip)
            .limit(limit)
            .all()
        )

# Создаем единственный экземпляр для использования в приложении
counterparty = CRUDCounterparty(Counterparty)