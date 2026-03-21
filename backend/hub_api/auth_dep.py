"""Shared auth dependency for FastAPI routes."""

import uuid as uuid_mod
from datetime import datetime, timezone

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from hub_api.config import settings
from hub_api.db.connection import get_db
from hub_api.db.models import AuthSession

SESSION_COOKIE = "dc_session"


def require_auth(request: Request, db: Session = Depends(get_db)) -> str:
    """Return email if session is valid; raise 401 otherwise.

    In dev_mode, bypasses session lookup and returns a fixed dev email.
    """
    if settings.dev_mode:
        return "dev@daisychain.local"

    session_id = request.cookies.get(SESSION_COOKIE)
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        sid = uuid_mod.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = db.query(AuthSession).filter(AuthSession.id == sid).first()
    if not session or datetime.now(timezone.utc) > session.expires_at:
        raise HTTPException(status_code=401, detail="Not authenticated")

    return session.email
