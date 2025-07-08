# /backend/app/crud/crud_budget_item.py

from app.crud.base import CRUDBase
from app.models.budget_item import BudgetItem
from app.schemas.budget import BudgetItemCreate, BudgetItemUpdate

class CRUDBudgetItem(CRUDBase[BudgetItem, BudgetItemCreate, BudgetItemUpdate]):
    # В данный момент нам не нужны какие-либо специальные методы,
    # так как CRUDBase уже содержит get, get_multi, create, update, remove.
    # Если в будущем понадобится специфическая логика, её можно будет добавить сюда.
    pass

# Создаем единственный экземпляр класса для использования во всем приложении
budget_item = CRUDBudgetItem(BudgetItem)