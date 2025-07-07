from typing import Optional, Dict, Any
from pydantic import BaseModel


class Token(BaseModel):
    """Token schema for authentication response"""
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    """Token payload schema for JWT decoding"""
    sub: Optional[int] = None


class SupabaseToken(BaseModel):
    """Supabase token schema for authentication response"""
    access_token: str
    token_type: str
    expires_in: int
    refresh_token: str
    user: Dict[str, Any]
