"""Auth routes: Google OAuth login/callback, session management."""

import secrets
import uuid as uuid_mod
from datetime import datetime, timezone
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session

from hub_api.config import settings
from hub_api.db.connection import get_db
from hub_api.db.models import AuthSession, AuthUser

router = APIRouter(prefix="/api/auth", tags=["auth"])

SESSION_COOKIE = "dc_session"
STATE_COOKIE = "oauth_state"

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ---------- login (redirect to Google) ----------


@router.get("/login")
async def login():
    if not settings.google_client_id:
        return JSONResponse({"error": "Google OAuth not configured"}, status_code=500)

    state = secrets.token_urlsafe(32)

    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "email profile",
        "state": state,
        "access_type": "online",
        "prompt": "select_account",
    }

    google_url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"

    response = RedirectResponse(google_url, status_code=302)
    response.set_cookie(
        STATE_COOKIE,
        state,
        max_age=600,
        httponly=True,
        secure=True,
        samesite="lax",
        path="/",
    )
    return response


# ---------- callback (Google redirects here) ----------


@router.get("/callback")
async def callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db),
):
    if error:
        return RedirectResponse("/login?error=cancelled", status_code=302)

    if not code or not state:
        return RedirectResponse("/login?error=invalid", status_code=302)

    # Validate state cookie
    stored_state = request.cookies.get(STATE_COOKIE)
    if not stored_state or stored_state != state:
        return RedirectResponse("/login?error=invalid", status_code=302)

    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
        )

        if token_resp.status_code != 200:
            return RedirectResponse("/login?error=token_failed", status_code=302)

        tokens = token_resp.json()
        access_token = tokens.get("access_token")
        if not access_token:
            return RedirectResponse("/login?error=token_failed", status_code=302)

        # Get user info
        userinfo_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )

        if userinfo_resp.status_code != 200:
            return RedirectResponse("/login?error=userinfo_failed", status_code=302)

        userinfo = userinfo_resp.json()

    email = userinfo.get("email", "").lower().strip()
    name = userinfo.get("name", "")
    picture = userinfo.get("picture", "")

    if not email:
        return RedirectResponse("/login?error=no_email", status_code=302)

    # Check whitelist
    user = db.query(AuthUser).filter(AuthUser.email == email).first()
    if not user or user.status != "approved":
        return RedirectResponse("/login?error=not_authorized", status_code=302)

    # Update user profile from Google
    user.name = name
    user.picture = picture

    # Create session
    session_id = uuid_mod.uuid4()
    db.add(AuthSession(id=session_id, email=email, expires_at=AuthSession.new_expiry()))
    db.flush()

    response = RedirectResponse("/", status_code=302)
    response.set_cookie(
        SESSION_COOKIE,
        str(session_id),
        max_age=settings.session_ttl,
        httponly=True,
        secure=True,
        samesite="lax",
        path="/",
    )
    response.delete_cookie(STATE_COOKIE, path="/")
    return response


# ---------- me (session check) ----------


def _get_session_id(request: Request) -> str | None:
    cookie = request.cookies.get(SESSION_COOKIE)
    return cookie if cookie else None


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

    user = db.query(AuthUser).filter(AuthUser.email == session.email).first()
    result = {"email": session.email}
    if user:
        if user.name:
            result["name"] = user.name
        if user.picture:
            result["picture"] = user.picture

    return result


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
