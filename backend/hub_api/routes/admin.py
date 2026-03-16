"""Admin routes: list pending requests, approve users, generate magic links."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from hub_api.config import settings
from hub_api.db.connection import get_db
from hub_api.db.models import AuthAccessRequest, AuthToken, AuthUser

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _validate_admin_key(request: Request, key: str | None = None, body_key: str | None = None) -> bool:
    """Check admin key from query param, Authorization header, or request body."""
    # Query param
    if key and key == settings.admin_secret:
        return True
    # Authorization header
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer ") and auth[7:] == settings.admin_secret:
        return True
    # Body key (passed from approve endpoint)
    if body_key and body_key == settings.admin_secret:
        return True
    return False


# ---------- pending ----------


@router.get("/pending")
async def pending(request: Request, key: str | None = None, db: Session = Depends(get_db)):
    if not _validate_admin_key(request, key=key):
        return JSONResponse({"error": "Unauthorized"}, status_code=401)

    requests = (
        db.query(AuthAccessRequest)
        .filter(AuthAccessRequest.status == "pending")
        .order_by(AuthAccessRequest.created_at.asc())
        .all()
    )

    return {
        "pending": [
            {
                "email": r.email,
                "message": r.message,
                "createdAt": r.created_at.isoformat() if r.created_at else None,
            }
            for r in requests
        ]
    }


# ---------- approve ----------


class ApproveBody(BaseModel):
    email: str
    key: str | None = None


@router.post("/approve")
async def approve(body: ApproveBody, request: Request, db: Session = Depends(get_db)):
    if not _validate_admin_key(request, body_key=body.key):
        return JSONResponse({"error": "Unauthorized"}, status_code=401)

    email = body.email.strip().lower()
    if not email:
        return JSONResponse({"error": "Email required"}, status_code=400)

    # Update access request status
    access_req = (
        db.query(AuthAccessRequest)
        .filter(AuthAccessRequest.email == email, AuthAccessRequest.status == "pending")
        .first()
    )
    if access_req:
        access_req.status = "approved"

    # Upsert user as approved
    user = db.query(AuthUser).filter(AuthUser.email == email).first()
    if user:
        user.status = "approved"
        user.approved_at = _utcnow()
    else:
        db.add(AuthUser(email=email, status="approved", approved_at=_utcnow()))

    # Generate magic link token
    token_id = uuid.uuid4()
    db.add(AuthToken(id=token_id, email=email, expires_at=AuthToken.new_expiry()))
    db.flush()

    # Use X-Forwarded-Host/Proto from the proxy to generate correct URL
    fwd_host = request.headers.get("X-Forwarded-Host", request.url.netloc)
    fwd_proto = request.headers.get("X-Forwarded-Proto", request.url.scheme)
    origin = f"{fwd_proto}://{fwd_host}"
    magic_link = f"{origin}/api/auth/verify?t={token_id}"

    return {"ok": True, "magicLink": magic_link, "email": email}
