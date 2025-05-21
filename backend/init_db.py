import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.init_db import init_db
from app.core.config import settings

def init():
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    init_db(db)

if __name__ == "__main__":
    init()
