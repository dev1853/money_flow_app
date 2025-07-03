# /backend/app/schemas/mapping_rule.py

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional

class MappingRuleBase(BaseModel):
    keyword: str = Field(..., min_length=1)
    dds_article_id: int

# --- СХЕМА, КОТОРАЯ ВЫЗЫВАЛА ОШИБКУ ---
class MappingRuleCreate(MappingRuleBase):
    pass

class MappingRuleUpdate(MappingRuleBase):
    pass

class MappingRule(MappingRuleBase):
    id: int
    workspace_id: int
    owner_id: int
    model_config = ConfigDict(from_attributes=True)

# Схема для пагинированного ответа
class MappingRulePage(BaseModel):
    rules: List[MappingRule]
    total_count: int