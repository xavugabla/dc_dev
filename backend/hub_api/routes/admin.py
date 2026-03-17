"""Admin routes: manage user whitelist."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from hub_api.config import settings
from hub_api.db.connection import get_db
from hub_api.db.models import AuthUser

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _validate_admin_key(request: Request, key: str | None = None, body_key: str | None = None) -> bool:
    if key and key == settings.admin_secret:
        return True
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer ") and auth[7:] == settings.admin_secret:
        return True
    if body_key and body_key == settings.admin_secret:
        return True
    return False


# ---------- list users ----------


@router.get("/users")
async def list_users(request: Request, key: str | None = None, db: Session = Depends(get_db)):
    if not _validate_admin_key(request, key=key):
        return JSONResponse({"error": "Unauthorized"}, status_code=401)

    users = db.query(AuthUser).order_by(AuthUser.created_at.asc()).all()

    return {
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "name": u.name,
                "status": u.status,
                "createdAt": u.created_at.isoformat() if u.created_at else None,
                "approvedAt": u.approved_at.isoformat() if u.approved_at else None,
            }
            for u in users
        ]
    }


# ---------- add user (direct whitelist) ----------


class AddUserBody(BaseModel):
    email: str
    key: str | None = None


@router.post("/add-user")
async def add_user(body: AddUserBody, request: Request, db: Session = Depends(get_db)):
    if not _validate_admin_key(request, body_key=body.key):
        return JSONResponse({"error": "Unauthorized"}, status_code=401)

    email = body.email.strip().lower()
    if not email or "@" not in email:
        return JSONResponse({"error": "Invalid email"}, status_code=400)

    existing = db.query(AuthUser).filter(AuthUser.email == email).first()
    if existing:
        if existing.status == "approved":
            return {"ok": True, "message": "Already approved", "email": email}
        existing.status = "approved"
        existing.approved_at = _utcnow()
    else:
        db.add(AuthUser(email=email, status="approved", approved_at=_utcnow()))

    return {"ok": True, "message": "User added to whitelist", "email": email}


# ---------- revoke user ----------


class RevokeBody(BaseModel):
    email: str
    key: str | None = None


@router.post("/revoke")
async def revoke(body: RevokeBody, request: Request, db: Session = Depends(get_db)):
    if not _validate_admin_key(request, body_key=body.key):
        return JSONResponse({"error": "Unauthorized"}, status_code=401)

    email = body.email.strip().lower()
    user = db.query(AuthUser).filter(AuthUser.email == email).first()
    if not user:
        return JSONResponse({"error": "User not found"}, status_code=404)

    user.status = "revoked"
    return {"ok": True, "message": "User revoked", "email": email}
