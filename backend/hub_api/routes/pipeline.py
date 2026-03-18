"""Pipeline proxy: forwards /api/pipeline/* to dc_async Cloud Run.
Checks session auth before proxying."""

import uuid as uuid_mod
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, Response
from sqlalchemy.orm import Session

from hub_api.config import settings
from hub_api.db.connection import get_db
from hub_api.db.models import AuthSession
from hub_api.gcp_auth import get_id_token

router = APIRouter(prefix="/api/pipeline", tags=["pipeline"])

SESSION_COOKIE = "dc_session"

# Reusable httpx client for proxying
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
async def proxy_pipeline(path: str, request: Request, db: Session = Depends(get_db)):
    # Auth check
    email = _check_session(request, db)
    if not email:
        return JSONResponse({"error": "Not authenticated"}, status_code=401)

    # Build target URL
    target = f"{settings.dc_async_url}/{path}"
    if request.url.query:
        target += f"?{request.url.query}"

    # Forward the request
    client = await _get_client()
    headers = dict(request.headers)
    headers.pop("host", None)
    headers.pop("cookie", None)  # Don't forward session cookie to dc_async

    # Add GCP OIDC token for Cloud Run service-to-service auth
    id_token = get_id_token(settings.dc_async_url)
    if id_token:
        headers["authorization"] = f"Bearer {id_token}"

    body = await request.body() if request.method not in ("GET", "HEAD") else None

    try:
        resp = await client.request(
            method=request.method,
            url=target,
            headers=headers,
            content=body,
        )
    except httpx.RequestError as e:
        return JSONResponse({"error": f"Pipeline service unavailable: {e}"}, status_code=502)

    # Relay response
    response_headers = dict(resp.headers)
    response_headers.pop("transfer-encoding", None)
    response_headers.pop("content-encoding", None)

    return Response(
        content=resp.content,
        status_code=resp.status_code,
        headers=response_headers,
    )
