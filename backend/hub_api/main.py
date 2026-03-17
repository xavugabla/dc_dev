"""DaisyChain Hub API — auth, admin, pipeline proxy."""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from hub_api.config import settings
from sqlalchemy import text

from hub_api.db.connection import Base, engine
from hub_api.db.models import AuthUser, AuthSession, AuthToken, AuthAccessRequest  # noqa: F401
from hub_api.routes import auth, admin, pipeline, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create auth tables only (auth_ prefix). Never touches one_click_dc tables.
    auth_tables = [
        t for t in Base.metadata.tables.values()
        if t.name.startswith("auth_")
    ]
    Base.metadata.create_all(bind=engine, tables=auth_tables)

    # Add new columns if they don't exist (safe to run repeatedly)
    with engine.begin() as conn:
        for col, col_type in [("name", "VARCHAR(255)"), ("picture", "TEXT")]:
            try:
                conn.execute(text(
                    f"ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS {col} {col_type}"
                ))
            except Exception:
                pass  # Column already exists
    yield


app = FastAPI(
    title="DaisyChain Hub API",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# CORS
_default_origins = ["http://localhost:3000", "http://localhost:4321"]
_cors_origins = settings.cors_origins
_origins = (
    [o.strip() for o in _cors_origins.split(",") if o.strip()]
    if _cors_origins
    else _default_origins
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(pipeline.router)
