# DaisyChain Hub — Dev Environment Recovery Plan

> Created: 2026-03-20

## Problem

Shipping to production required routing everything through the hub gateway (CF Pages Functions → Cloud Run). This broke local development:

- Frontend can't call APIs without the CF proxy layer
- Auth middleware expects `dc_session` cookies and OIDC tokens
- Sub-app proxying doesn't exist locally
- No way to develop the hub + child apps together without deploying

## Goal

Run the full platform locally with `docker compose up` (or similar), preserving:
- Hot reload for Astro frontend
- Hot reload for FastAPI backend
- Auth bypass for local dev
- Ability to proxy to local child apps OR their production URLs
- **Zero changes** to production code paths — local dev uses env vars and config only

---

## Architecture: Local Dev Stack

```
Browser
  ├── localhost:4321          → Astro dev server (hub frontend)
  ├── localhost:4321/api/*    → Astro dev proxy → localhost:8003 (hub backend)
  ├── localhost:4321/engine/* → Astro dev proxy → localhost:3000 (engine frontend)
  └── localhost:4321/api/engine/* → Astro dev proxy → localhost:8001 (engine backend)

Hub Backend (localhost:8003)
  ├── /api/portal/*   → localhost:8080 (portal) or prod URL
  ├── /api/pipeline/* → localhost:8002 (notion-sync) or prod URL
  └── Local SQLite or local Postgres for auth_sessions
```

---

## Implementation Steps

### Step 1: Hub Backend — Local Mode

**File**: `backend/hub_api/config.py`

Add a `DEV_MODE` env var check. When `DEV_MODE=true`:
- Skip OIDC token generation for downstream calls (call localhost directly)
- Use local DB (SQLite or local Postgres) instead of Neon
- Auto-create a dev session (bypass Google OAuth)
- Accept any request as authenticated (skip session validation)

**New endpoint**: `POST /api/auth/dev-login` — creates a `dc_session` cookie with a hardcoded dev user. Only available when `DEV_MODE=true`.

### Step 2: Hub Frontend — Astro Dev Proxy

**File**: `astro.config.mjs`

Add Vite server proxy config for local dev:

```js
export default defineConfig({
  output: 'static',
  vite: {
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8003',
          changeOrigin: true,
        },
        '/engine': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/engine/, ''),
        },
        '/api/engine': {
          target: 'http://localhost:8001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/engine/, ''),
        },
        '/portal': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/portal/, ''),
        },
        '/api/portal': {
          target: 'http://localhost:8003',
          changeOrigin: true,
        },
        '/notion-sync': {
          target: 'http://localhost:8002',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/notion-sync/, ''),
        },
        '/api/notion-sync': {
          target: 'http://localhost:8003',
          changeOrigin: true,
        },
      },
    },
  },
});
```

This mirrors the CF Functions proxy layer but locally via Vite's built-in proxy. The proxy config only runs during `astro dev`, not in production builds.

### Step 3: Hub docker-compose.yml (new)

```yaml
services:
  hub-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: dc_hub
    ports:
      - "5434:5432"
    volumes:
      - hub_db_data:/var/lib/postgresql/data

  hub-api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DEV_MODE: "true"
      DATABASE_URL: postgresql://postgres:postgres@hub-db:5432/dc_hub
      PARTNER_API_URL: http://host.docker.internal:8080
      DC_ASYNC_URL: http://host.docker.internal:8002
      CORS_ORIGINS: http://localhost:4321
      ADMIN_SECRET: dev-secret
    ports:
      - "8003:8003"
    volumes:
      - ./backend:/app
    depends_on:
      - hub-db
    command: uvicorn hub_api.main:app --host 0.0.0.0 --port 8003 --reload

volumes:
  hub_db_data:
```

### Step 4: Dev Script

**File**: `scripts/dev.sh`

```bash
#!/bin/bash
# Start hub backend + db
docker compose up -d

# Start Astro dev server
npm run dev
```

### Step 5: .env.development (new, gitignored)

```env
DEV_MODE=true
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/dc_hub
ADMIN_SECRET=dev-secret
```

---

## Dev Modes Matrix

| Scenario | Hub Frontend | Hub Backend | Child Apps |
|----------|-------------|-------------|------------|
| **Hub only** | `astro dev` | `docker compose up` | Use prod URLs via proxy |
| **Hub + Engine** | `astro dev` (proxies /engine/) | `docker compose up` | Engine: `docker compose up` in one_click_dc |
| **Child app standalone** | Not running | Not running | `npm run dev` + local backend (existing workflow) |

---

## Key Principle: No Production Code Changes

The proxy config in `astro.config.mjs` only applies during `astro dev`. Production builds are static HTML — the CF Functions handle proxying in prod.

The `DEV_MODE` flag in the backend gates all dev shortcuts. It must never be set in Cloud Run.

Child apps already default to `/` base and `/api` API base when `VITE_BASE_PATH` is unset — this is the local dev path, already working.

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `astro.config.mjs` | Modify | Add Vite proxy config |
| `backend/hub_api/config.py` | Modify | Add DEV_MODE flag |
| `backend/hub_api/routes/auth.py` | Modify | Add dev-login endpoint |
| `backend/hub_api/middleware.py` | Modify | Skip session validation in DEV_MODE |
| `docker-compose.yml` | Create | Local hub backend + Postgres |
| `scripts/dev.sh` | Create | One-command local startup |
| `.env.development` | Create | Local env defaults (gitignored) |

---

## What This Unlocks

1. **Edit hub pages** → instant Astro HMR
2. **Edit hub backend** → uvicorn auto-reload
3. **Edit Engine frontend** → Vite HMR through hub proxy
4. **Edit Engine backend** → uvicorn auto-reload through hub proxy
5. **Test full auth flow** → dev-login bypasses OAuth
6. **Test routing** → same URL structure as production
7. **Work offline** → no dependency on CF or Cloud Run
