from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from app.db.session import Base


class Client(Base, BaseModel):
    """Client model for storing client information"""
    
    name = Column(String, nullable=False, index=True)
    email = Column(String, nullable=False)
    phone = Column(String)
    address = Column(String)
    company = Column(String)
    notes = Column(Text)
    
    # Relationships
    user_id = Column(ForeignKey("user.id"), nullable=False)
    user = relationship("User", back_populates="clients")
    invoices = relationship("Invoice", back_populates="client", cascade="all, delete-orphan")
