# /backend/app/schemas/dds_article.py

from __future__ import annotations 
from typing import List, Optional
from pydantic import BaseModel, Field
from .base import BaseSchema

class DdsArticle(BaseSchema):
    id: int
    name: str
    article_type: str
    workspace_id: int

# --- Базовая схема для статьи ---
class DdsArticleBase(BaseSchema):
    name: str
    article_type: str # 'income', 'expense', 'group'
    parent_id: Optional[int] = None


# --- Схема для создания ---
class DdsArticleCreate(DdsArticleBase):
    workspace_id: int


# --- Схема для чтения с вложенными детьми ---
# Это основная схема, которую мы используем для отображения дерева
class DdsArticle(DdsArticleBase):
    id: int
    # owner_id: int
    workspace_id: int
    
    # Поле для рекурсии - список таких же DdsArticle
    children: List['DdsArticle'] = []

    class Config:
        orm_mode = True # Для Pydantic v1
        # from_attributes = True # Для Pydantic v2

# --- Схема для обновления ---
class DdsArticleUpdate(DdsArticleBase):
    name: Optional[str] = None
    article_type: Optional[str] = None

DdsArticle.update_forward_refs()