from sqlalchemy import Column, String, Float, Date, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
import enum
from app.models.base import BaseModel
from app.db.session import Base


class PaymentMethod(str, enum.Enum):
    CREDIT_CARD = "credit_card"
    BANK_TRANSFER = "bank_transfer"
    CASH = "cash"
    CHECK = "check"
    OTHER = "other"


class Payment(Base, BaseModel):
    """Payment model for storing payment information"""
    
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    method = Column(Enum(PaymentMethod), nullable=False)
    reference = Column(String)
    notes = Column(Text)
    
    # Relationships
    invoice_id = Column(ForeignKey("invoice.id"), nullable=False)
    invoice = relationship("Invoice", back_populates="payments")
    user_id = Column(ForeignKey("user.id"), nullable=False)
    user = relationship("User", back_populates="payments")
