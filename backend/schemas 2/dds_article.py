# /backend/app/schemas/dds_article.py
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional

class DdsArticleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    article_type: str
    parent_id: Optional[int] = None

class DdsArticleCreate(DdsArticleBase):
    workspace_id: int

class DdsArticleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    parent_id: Optional[int] = None

class DdsArticle(DdsArticleBase):
    id: int
    workspace_id: int
    children: List['DdsArticle'] = []
    model_config = ConfigDict(from_attributes=True)

DdsArticle.model_rebuild()