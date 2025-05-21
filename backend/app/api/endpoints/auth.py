from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.dependencies.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import User as UserSchema

router = APIRouter()

# This endpoint is just a proxy to Supabase Auth
# The actual authentication is handled by Supabase
@router.post("/login")
async def login_proxy():
    """
    Proxy endpoint for Supabase Auth login

    Authentication is handled directly by the frontend using Supabase Auth.
    This endpoint exists for API documentation purposes.
    """
    return {
        "message": "Authentication is handled by Supabase Auth on the frontend"
    }

@router.post("/register")
async def register_proxy():
    """
    Proxy endpoint for Supabase Auth registration

    Registration is handled directly by the frontend using Supabase Auth.
    This endpoint exists for API documentation purposes.
    """
    return {
        "message": "Registration is handled by Supabase Auth on the frontend"
    }

@router.post("/logout")
async def logout_proxy():
    """
    Proxy endpoint for Supabase Auth logout

    Logout is handled directly by the frontend using Supabase Auth.
    This endpoint exists for API documentation purposes.
    """
    return {
        "message": "Logout is handled by Supabase Auth on the frontend"
    }

@router.get("/me", response_model=UserSchema)
async def get_current_user_info(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Get current user information
    """
    return user
