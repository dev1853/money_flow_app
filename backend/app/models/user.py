# app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from ..database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean(), default=True)
    is_superuser = Column(Boolean(), default=False)
    
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    active_workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True)

    role = relationship("Role", back_populates="users")
    
    workspaces = relationship("Workspace", back_populates="owner", primaryjoin="User.id == Workspace.owner_id")
    accounts = relationship("Account", back_populates="owner")
    transactions = relationship("Transaction", back_populates="user")
    budgets = relationship("Budget", back_populates="owner")
    mapping_rules = relationship("MappingRule", back_populates="owner")