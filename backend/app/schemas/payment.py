from typing import Optional
from pydantic import BaseModel, Field
from datetime import date, datetime
from app.models.payment import PaymentMethod


class PaymentBase(BaseModel):
    """Base payment schema"""
    amount: Optional[float] = None
    date: Optional[date] = None
    method: Optional[PaymentMethod] = None
    reference: Optional[str] = None
    notes: Optional[str] = None
    invoice_id: Optional[int] = None


class PaymentCreate(PaymentBase):
    """Payment creation schema"""
    amount: float = Field(..., gt=0)
    date: date
    method: PaymentMethod
    invoice_id: int


class PaymentUpdate(PaymentBase):
    """Payment update schema"""
    pass


class PaymentInDBBase(PaymentBase):
    """Base payment schema for DB representation"""
    id: int
    created_at: datetime
    updated_at: datetime
    user_id: int

    class Config:
        orm_mode = True


class Payment(PaymentInDBBase):
    """Payment schema for API response"""
    pass
