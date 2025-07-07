from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import date, datetime
from app.models.invoice import InvoiceStatus


class InvoiceItemBase(BaseModel):
    """Base invoice item schema"""
    description: Optional[str] = None
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    amount: Optional[float] = None


class InvoiceItemCreate(InvoiceItemBase):
    """Invoice item creation schema"""
    description: str
    quantity: float = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)
    amount: float = Field(..., gt=0)


class InvoiceItemUpdate(InvoiceItemBase):
    """Invoice item update schema"""
    pass


class InvoiceItemInDBBase(InvoiceItemBase):
    """Base invoice item schema for DB representation"""
    id: int
    invoice_id: int

    class Config:
        orm_mode = True


class InvoiceItem(InvoiceItemInDBBase):
    """Invoice item schema for API response"""
    pass


class InvoiceBase(BaseModel):
    """Base invoice schema"""
    number: Optional[str] = None
    status: Optional[InvoiceStatus] = None
    issued_date: Optional[date] = None
    due_date: Optional[date] = None
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    discount: Optional[float] = None
    total: Optional[float] = None
    notes: Optional[str] = None
    client_id: Optional[int] = None


class InvoiceCreate(InvoiceBase):
    """Invoice creation schema"""
    number: str
    issued_date: date
    due_date: date
    subtotal: float = Field(..., ge=0)
    tax: float = Field(0, ge=0)
    discount: float = Field(0, ge=0)
    total: float = Field(..., gt=0)
    client_id: int
    items: List[InvoiceItemCreate]


class InvoiceUpdate(InvoiceBase):
    """Invoice update schema"""
    items: Optional[List[InvoiceItemCreate]] = None


class InvoiceInDBBase(InvoiceBase):
    """Base invoice schema for DB representation"""
    id: int
    created_at: datetime
    updated_at: datetime
    user_id: int

    class Config:
        orm_mode = True


class Invoice(InvoiceInDBBase):
    """Invoice schema for API response"""
    items: List[InvoiceItem] = []
