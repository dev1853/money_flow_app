# app/models/workspace.py
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from ..database import Base

class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="workspaces", primaryjoin="Workspace.owner_id == User.id")
    
    accounts = relationship("Account", back_populates="workspace")
    transactions = relationship("Transaction", back_populates="workspace")
    budgets = relationship("Budget", back_populates="workspace")
    mapping_rules = relationship("MappingRule", back_populates="workspace")
    dds_articles = relationship("DdsArticle", back_populates="workspace")