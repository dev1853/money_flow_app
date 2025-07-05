# app/models/dds_article.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from ..database import Base
from .mixins import TimestampMixin

class DdsArticle(Base, TimestampMixin):
    __tablename__ = "dds_articles"

    # ВОТ ЭТА СТРОКА БЫЛА ПРОПУЩЕНА
    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False, index=True)
    article_type = Column(String, nullable=False)
    parent_id = Column(Integer, ForeignKey("dds_articles.id"), nullable=True)
    is_active = Column(Boolean(), default=True, nullable=False)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)

    parent = relationship("DdsArticle", remote_side=[id], back_populates="children")
    children = relationship("DdsArticle", back_populates="parent")
    workspace = relationship("Workspace", back_populates="dds_articles")
    
    transactions = relationship("Transaction", back_populates="dds_article")
    budget_items = relationship("BudgetItem", back_populates="dds_article")
    mapping_rules = relationship("MappingRule", back_populates="dds_article")

    __table_args__ = (
        UniqueConstraint('name', 'workspace_id', name='_dds_article_name_workspace_uc'),
    )