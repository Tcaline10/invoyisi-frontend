from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class ClientBase(BaseModel):
    """Base client schema"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None


class ClientCreate(ClientBase):
    """Client creation schema"""
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr


class ClientUpdate(ClientBase):
    """Client update schema"""
    pass


class ClientInDBBase(ClientBase):
    """Base client schema for DB representation"""
    id: int
    created_at: datetime
    updated_at: datetime
    user_id: int

    class Config:
        orm_mode = True


class Client(ClientInDBBase):
    """Client schema for API response"""
    pass
