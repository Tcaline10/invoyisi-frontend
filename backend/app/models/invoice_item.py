from sqlalchemy import Column, String, Float, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from app.db.session import Base


class InvoiceItem(Base, BaseModel):
    """Invoice item model for storing line items in invoices"""
    
    description = Column(String, nullable=False)
    quantity = Column(Float, nullable=False, default=1.0)
    unit_price = Column(Float, nullable=False)
    amount = Column(Float, nullable=False)
    
    # Relationships
    invoice_id = Column(ForeignKey("invoice.id"), nullable=False)
    invoice = relationship("Invoice", back_populates="items")
