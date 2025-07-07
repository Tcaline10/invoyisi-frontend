from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.user import User
from app.core.config import settings


def init_db(db: Session) -> None:
    """
    Initialize the database with initial data
    """
    # Create a superuser if it doesn't exist
    user = db.query(User).filter(User.email == "admin@invoiceai.com").first()
    if not user:
        user = User(
            email="admin@invoiceai.com",
            full_name="Admin User",
            hashed_password=get_password_hash("adminpassword"),
            is_active=True,
            is_superuser=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
