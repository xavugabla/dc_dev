"""Auth routes: request-access, verify (magic link), me, logout."""

import re
import uuid as uuid_mod
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from hub_api.config import settings
from hub_api.db.connection import get_db
from hub_api.db.models import AuthAccessRequest, AuthSession, AuthToken, AuthUser

router = APIRouter(prefix="/api/auth", tags=["auth"])

SESSION_COOKIE = "dc_session"
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _get_session_id(request: Request) -> str | None:
    cookie = request.cookies.get(SESSION_COOKIE)
    return cookie if cookie else None


# ---------- request-access ----------


class AccessRequestBody(BaseModel):
    email: str
    message: str = ""


@router.post("/request-access")
async def request_access(body: AccessRequestBody, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    if not EMAIL_RE.match(email):
        return JSONResponse({"error": "Invalid email"}, status_code=400)

    # Check if already approved
    user = db.query(AuthUser).filter(AuthUser.email == email).first()
    if user and user.status == "approved":
        return JSONResponse(
            {"error": "Already approved. Use your magic link to sign in."},
            status_code=400,
        )

    # Upsert access request
    existing = (
        db.query(AuthAccessRequest)
        .filter(AuthAccessRequest.email == email, AuthAccessRequest.status == "pending")
        .first()
    )
    if existing:
        existing.message = body.message.strip()
    else:
        db.add(AuthAccessRequest(email=email, message=body.message.strip()))

    return {"ok": True, "message": "Request submitted. You'll receive access when approved."}


# ---------- verify (magic link) ----------


@router.get("/verify")
async def verify(t: str, db: Session = Depends(get_db)):
    try:
        token_uuid = uuid_mod.UUID(t)
    except ValueError:
        return RedirectResponse("/login?error=expired", status_code=302)
    tok = db.query(AuthToken).filter(AuthToken.id == token_uuid).first()
    if not tok:
        return RedirectResponse("/login?error=expired", status_code=302)

    if tok.used_at or _utcnow() > tok.expires_at:
        return RedirectResponse("/login?error=expired", status_code=302)

    # Consume the token
    tok.used_at = _utcnow()

    # Create session
    session = AuthSession(email=tok.email, expires_at=AuthSession.new_expiry())
    db.add(session)
    db.flush()  # get the session id

    response = RedirectResponse("/", status_code=302)
    response.set_cookie(
        key=SESSION_COOKIE,
        value=str(session.id),
        path="/",
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.session_ttl,
    )
    return response


# ---------- me (session check) ----------


@router.get("/me")
async def me(request: Request, db: Session = Depends(get_db)):
    session_id = _get_session_id(request)
    if not session_id:
        return JSONResponse({"error": "Not authenticated"}, status_code=401)

    try:
        sid = uuid_mod.UUID(session_id)
    except ValueError:
        return JSONResponse({"error": "Not authenticated"}, status_code=401)
    session = db.query(AuthSession).filter(AuthSession.id == sid).first()
    if not session or _utcnow() > session.expires_at:
        return JSONResponse({"error": "Session expired"}, status_code=401)

    return {"email": session.email}


# ---------- logout ----------


@router.post("/logout")
async def logout(request: Request, db: Session = Depends(get_db)):
    session_id = _get_session_id(request)
    if session_id:
        try:
            sid = uuid_mod.UUID(session_id)
            session = db.query(AuthSession).filter(AuthSession.id == sid).first()
            if session:
                db.delete(session)
        except ValueError:
            pass

    response = JSONResponse({"ok": True})
    response.delete_cookie(SESSION_COOKIE, path="/")
    return response
