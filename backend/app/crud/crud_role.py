# backend/app/crud/crud_role.py

from app.crud.base import CRUDBase
from app.models.role import Role
from app.schemas.role import RoleCreate, RoleUpdate

class CRUDRole(CRUDBase[Role, RoleCreate, RoleUpdate]):
    # Здесь можно добавить специфичные для ролей методы, если они понадобятся.
    # Например, get_by_name и т.д.
    pass

role = CRUDRole(Role)