"""SQLAlchemy engine and session factory for Neon Postgres."""

import os
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from hub_api.config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=int(os.environ.get("DB_POOL_SIZE", "3")),
    max_overflow=int(os.environ.get("DB_MAX_OVERFLOW", "2")),
    pool_recycle=300,
    echo=settings.debug,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency providing a DB session."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
