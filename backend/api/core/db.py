# api/core/db.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from api.core.settings import DATABASE_URL

# Para SQLite com FastAPI (threads)
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# FastAPI dependency: injeta/fecha sessão por request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
