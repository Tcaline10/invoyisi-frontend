from sqlalchemy import Column, String, Float, Date, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
import enum
from app.models.base import BaseModel
from app.db.session import Base


class InvoiceStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class Invoice(Base, BaseModel):
    """Invoice model for storing invoice information"""
    
    number = Column(String, nullable=False, index=True)
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.DRAFT, nullable=False)
    issued_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    subtotal = Column(Float, nullable=False)
    tax = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    total = Column(Float, nullable=False)
    notes = Column(Text)
    
    # Relationships
    client_id = Column(ForeignKey("client.id"), nullable=False)
    client = relationship("Client", back_populates="invoices")
    user_id = Column(ForeignKey("user.id"), nullable=False)
    user = relationship("User", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")
