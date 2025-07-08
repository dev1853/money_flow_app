# app/models/budget_item.py
from sqlalchemy import Column, Integer, String, ForeignKey, Numeric, CheckConstraint
from sqlalchemy.orm import relationship
from decimal import Decimal

from ..database import Base
from .mixins import TimestampMixin

class BudgetItem(Base, TimestampMixin):
    __tablename__ = "budget_items"
    __table_args__ = (
        CheckConstraint('budgeted_amount > 0', name='check_budget_item_amount_positive'),
    )

    id = Column(Integer, primary_key=True, index=True)
    budgeted_amount = Column(Numeric(15, 2), nullable=False)
    # ИСПРАВЛЕНИЕ: Делаем nullable=True и добавляем default='expense'
    type = Column(String(10), nullable=True, default='expense') 
    
    budget_id = Column(Integer, ForeignKey("budgets.id"), nullable=False)
    dds_article_id = Column(Integer, ForeignKey("dds_articles.id"), nullable=False)

    budget = relationship("Budget", back_populates="budget_items")
    dds_article = relationship("DdsArticle", back_populates="budget_items")