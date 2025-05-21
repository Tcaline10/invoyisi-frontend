from typing import Optional
import httpx
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User

# Use HTTPBearer for Supabase JWT tokens
security = HTTPBearer()

async def get_supabase_user(token: str) -> dict:
    """
    Verify a Supabase JWT token and get user information
    """
    url = f"{settings.SUPABASE_URL}/auth/v1/user"
    headers = {
        "Authorization": f"Bearer {token}",
        "apikey": settings.SUPABASE_ANON_KEY
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        if response.status_code == 200:
            return response.json()
        return None

async def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """
    Get the current authenticated user using Supabase Auth
    """
    token = credentials.credentials
    supabase_user = await get_supabase_user(token)

    if not supabase_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user from our database
    user = db.query(User).filter(User.id == supabase_user["id"]).first()

    # If user doesn't exist in our database but exists in Supabase,
    # create a new user record
    if not user:
        user = User(
            id=supabase_user["id"],
            email=supabase_user["email"],
            full_name=supabase_user.get("user_metadata", {}).get("full_name", ""),
            hashed_password="",  # We don't store the password, Supabase handles that
            is_active=True,
            is_superuser=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Get the current active user
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
    return current_user

def get_current_active_superuser(current_user: User = Depends(get_current_user)) -> User:
    """
    Get the current active superuser
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return current_user

# This function is kept for compatibility but is no longer used directly
# Authentication is now handled by Supabase
def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    Authenticate a user with email and password (legacy)
    """
    user = db.query(User).filter(User.email == email).first()
    return user
