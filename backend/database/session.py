from __future__ import annotations
from typing import Generator, Optional
from sqlalchemy.orm import Session

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# Database URL (env with sane default for local/dev - using SQLite)
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "sqlite:///./complicopilot.db",
)

# Engine config - adjust for SQLite vs PostgreSQL
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True if not DATABASE_URL.startswith("sqlite") else False,
    future=True,
    connect_args=connect_args,
)

# Session factory
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    """
    Yield a SQLAlchemy Session for request-scoped DB access.

    Usage:
        def route(db: Session = Depends(get_db)):
            ...
    """
    db: Optional[Session] = None
    try:
        db = SessionLocal()
        yield db
    finally:
        if db is not None:
            db.close()