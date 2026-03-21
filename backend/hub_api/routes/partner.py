"""Portal proxy: forwards /api/portal/* to dc-portal-api Cloud Run.
Checks session auth and injects X-DC-User-Email / X-DC-Admin headers."""

import httpx
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, Response

from hub_api.auth_dep import require_auth
from hub_api.config import settings
from hub_api.gcp_auth import get_id_token

router = APIRouter(prefix="/api/portal", tags=["portal"])

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


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_partner(path: str, request: Request, email: str = Depends(require_auth)):
    # Rewrite /api/portal/* → /api/*
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

    # Add GCP OIDC token for Cloud Run service-to-service auth (skip in dev)
    if not settings.dev_mode:
        id_token = get_id_token(settings.partner_api_url)
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
        return JSONResponse({"error": f"Partner service unavailable: {e}"}, status_code=502)

    response_headers = dict(resp.headers)
    response_headers.pop("transfer-encoding", None)
    response_headers.pop("content-encoding", None)

    return Response(
        content=resp.content,
        status_code=resp.status_code,
        headers=response_headers,
    )
