from datetime import datetime
from sqlalchemy import Column, DateTime, Integer
from sqlalchemy.ext.declarative import declared_attr
from app.db.session import Base


class BaseModel:
    """Base model for all database models"""
    
    @declared_attr
    def __tablename__(cls):
        return cls.__name__.lower()
    
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
