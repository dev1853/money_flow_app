# app/models/mapping_rule.py
from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from ..database import Base
from .mixins import TimestampMixin

class MappingRule(Base, TimestampMixin):
    __tablename__ = "mapping_rules"
    __table_args__ = (
        UniqueConstraint('keyword', 'workspace_id', name='_keyword_workspace_uc'),
    )

    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String, nullable=False, index=True)
    
    dds_article_id = Column(Integer, ForeignKey("dds_articles.id"), nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    dds_article = relationship("DdsArticle", back_populates="mapping_rules")
    workspace = relationship("Workspace", back_populates="mapping_rules")
    owner = relationship("User", back_populates="mapping_rules")