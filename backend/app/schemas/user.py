from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """Base user schema"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = True


class UserCreate(UserBase):
    """User creation schema"""
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8)


class UserUpdate(UserBase):
    """User update schema"""
    password: Optional[str] = Field(None, min_length=8)


class UserInDBBase(UserBase):
    """Base user schema for DB representation"""
    id: Optional[int] = None

    class Config:
        orm_mode = True


class User(UserInDBBase):
    """User schema for API response"""
    pass


class UserInDB(UserInDBBase):
    """User schema with hashed password for internal use"""
    hashed_password: str
