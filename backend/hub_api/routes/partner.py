"""Partner proxy: forwards /api/partner/* to partner-portal-api Cloud Run.
Checks session auth and injects X-DC-User-Email / X-DC-Admin headers."""

import uuid as uuid_mod
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, Response
from sqlalchemy.orm import Session

from hub_api.config import settings
from hub_api.db.connection import get_db
from hub_api.db.models import AuthSession

router = APIRouter(prefix="/api/partner", tags=["partner"])

SESSION_COOKIE = "dc_session"

# Admin emails that get X-DC-Admin: true when proxied to partner services
DC_ADMIN_EMAILS = {
    "masterxavuga@gmail.com",
}

_client: httpx.AsyncClient | None = None


async def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=30.0)
    return _client


def _check_session(request: Request, db: Session) -> str | None:
    """Return email if session is valid, else None."""
    session_id = request.cookies.get(SESSION_COOKIE)
    if not session_id:
        return None
    try:
        sid = uuid_mod.UUID(session_id)
    except ValueError:
        return None
    session = db.query(AuthSession).filter(AuthSession.id == sid).first()
    if not session or datetime.now(timezone.utc) > session.expires_at:
        return None
    return session.email


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_partner(path: str, request: Request, db: Session = Depends(get_db)):
    # Auth check
    email = _check_session(request, db)
    if not email:
        return JSONResponse({"error": "Not authenticated"}, status_code=401)

    # Rewrite /api/partner/* → /api/*
    target = f"{settings.partner_api_url}/api/{path}"
    if request.url.query:
        target += f"?{request.url.query}"

    client = await _get_client()
    headers = dict(request.headers)
    headers.pop("host", None)
    headers.pop("cookie", None)

    # Inject identity headers
    headers["x-dc-user-email"] = email
    headers["x-dc-admin"] = "true" if email in DC_ADMIN_EMAILS else "false"

    body = await request.body() if request.method not in ("GET", "HEAD") else None

    try:
        resp = await client.request(
            method=request.method,
            url=target,
            headers=headers,
            content=body,
        )
    except httpx.RequestError as e:
        return JSONResponse({"error": f"Partner service unavailable: {e}"}, status_code=502)

    response_headers = dict(resp.headers)
    response_headers.pop("transfer-encoding", None)
    response_headers.pop("content-encoding", None)

    return Response(
        content=resp.content,
        status_code=resp.status_code,
        headers=response_headers,
    )
