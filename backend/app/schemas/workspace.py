# /backend/app/schemas/workspace.py

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

# Базовая схема теперь содержит только общие поля, которые есть в модели
class WorkspaceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

# Схема для создания. Она не должна содержать 'description'.
class WorkspaceCreate(WorkspaceBase):
    pass

# Схема для обновления.
class WorkspaceUpdate(WorkspaceBase):
    pass

# Схема для ответа API. Здесь мы можем добавить необязательные поля,
# даже если их нет в модели, но лучше держать их в синхронизации.
# Если в модели `models.Workspace` нет `description`, то и здесь его быть не должно.
class Workspace(WorkspaceBase):
    id: int
    owner_id: int
    # description: Optional[str] = None # Убираем, чтобы схема точно соответствовала модели
    model_config = ConfigDict(from_attributes=True)