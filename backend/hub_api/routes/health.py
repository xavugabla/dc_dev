"""Health check endpoint."""

from fastapi import APIRouter
from sqlalchemy import text

from hub_api.db.connection import SessionLocal

router = APIRouter()


@router.get("/api/health")
async def health():
    db_ok = False
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        db_ok = True
    except Exception:
        pass

    return {
        "status": "ok" if db_ok else "degraded",
        "database": db_ok,
    }
