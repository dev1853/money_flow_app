# app/models/role.py
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from ..database import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)
    
    users = relationship("User", back_populates="role")