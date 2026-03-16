"""Auth models for the hub. All tables prefixed auth_ to avoid conflicts
with one_click_dc's Alembic-managed schema."""

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID

from hub_api.db.connection import Base
from hub_api.config import settings


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AuthUser(Base):
    __tablename__ = "auth_users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    status = Column(String(20), nullable=False, default="pending")  # pending, approved, revoked
    created_at = Column(DateTime(timezone=True), default=_utcnow)
    approved_at = Column(DateTime(timezone=True), nullable=True)


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow)

    @staticmethod
    def new_expiry() -> datetime:
        return _utcnow() + timedelta(seconds=settings.session_ttl)


class AuthToken(Base):
    __tablename__ = "auth_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow)
    used_at = Column(DateTime(timezone=True), nullable=True)

    @staticmethod
    def new_expiry() -> datetime:
        return _utcnow() + timedelta(seconds=settings.token_ttl)


class AuthAccessRequest(Base):
    __tablename__ = "auth_access_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), nullable=False, index=True)
    message = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="pending")
    created_at = Column(DateTime(timezone=True), default=_utcnow)
