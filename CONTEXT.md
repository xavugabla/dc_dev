# DaisyChain Hub — Living Context

> Last updated: 2026-03-19

---

## Platform Overview

| Project | Repo | CF Pages | Cloud Run | Port | Hub Route |
|---------|------|----------|-----------|------|-----------|
| **Hub (Gateway)** | `dc_dev` | `dc-hub.pages.dev` | `dc-hub-api` | 8003 | `/` |
| **Engine** | `one_click_dc` | `dc-engine.pages.dev` | `dc-engine-api` | 8001 | `/engine/*` |
| **Notion Sync** | `dc_async` | `dc-notion-sync.pages.dev` | `dc-notion-sync-api` | 8002 | `/notion-sync/*` |
| **Portal** | `daisychain-partner-portal` | `dc-portal.pages.dev` | `dc-portal-api` | 8080 | `/portal/*` |
| **BD Tools** | `bd-tools` | `dc-bd-tools.pages.dev` | — | — | `/bd-tools/*` |

**Gateway routing** (all under `dc-hub.pages.dev`):

| Path | Handler | Target |
|------|---------|--------|
| `/api/*` | CF Function → Cloud Run | `dc-hub-api` |
| `/api/engine/*` | CF Function → Cloud Run | `dc-engine-api` (strips `/api/engine`) |
| `/api/notion-sync/*` | CF Function → Cloud Run | `dc-notion-sync-api` (strips `/api/notion-sync`) |
| `/api/portal/health/*` | CF Function → Cloud Run | `dc-portal-api` (strips `/api/portal`, direct) |
| `/api/portal/*` | CF Function → Hub backend → Cloud Run | `dc-hub-api` proxies to `dc-portal-api` (session-gated, injects identity headers) |
| `/engine/*` | CF Function | `dc-engine.pages.dev` (frontend proxy) |
| `/notion-sync/*` | CF Function | `dc-notion-sync.pages.dev` (frontend proxy) |
| `/portal/*` | CF Function | `dc-portal.pages.dev` (frontend proxy, SPA fallback) |
| `/bd-tools/*` | CF Function | `dc-bd-tools.pages.dev` (static proxy) |

---

## Hub Pages

| Route | Content |
|-------|---------|
| `/` | Clean navigation hub — 4 cards: Docs, Performance, Projects, Admin |
| `/docs/` | Documentation index — links to architecture, brand manual, UI reference |
| `/docs/architecture/` | Renders `docs/ARCHITECTURE.md` |
| `/docs/brand-manual/` | Renders `docs/BRAND_MANUAL.md` |
| `/docs/look/` | Renders `docs/look.md` |
| `/performance/` | System health dashboard — API health, latency, deployments, metrics |
| `/projects/` | Project cards with `target="_blank"` links to child SPAs |
| `/admin/` | User management (requires admin key) |
| `/login/` | Google OAuth sign-in |

All hub pages (except `/login/`, `/admin/`) require `dc_session` cookie.

## Current Goals

- Implement VITE_BASE_PATH architecture across all Vite sub-apps (see `ARCHITECTURE_BASE_PATH.md`)
- Container-based Cloud Run deployments for all services (completed 2026-03-19)

---

## Auth Architecture

### Layer-by-Layer Flow

```
Browser → CF Pages Middleware → CF Functions → Cloud Run (via OIDC) → Backend
```

| Layer | Mechanism | Details |
|-------|-----------|---------|
| **CF Pages Middleware** | `dc_session` cookie check | Presence-only; redirects to `/login` if missing. Public paths: `/login`, `/api/*`, `/admin/*`. |
| **CF Functions → Cloud Run** | GCP OIDC token | RS256 JWT signed with `dc-hub-invoker` service account via `GCP_SERVICE_ACCOUNT_KEY` env var. Cached 55 min. |
| **Hub Backend (portal proxy)** | Session validation + OIDC for second hop | Looks up `auth_sessions` table, checks `expires_at`. Injects `X-DC-User-Email` + `X-DC-Admin` headers. Adds OIDC for `dc-portal-api`. |
| **Hub Backend (pipeline proxy)** | Session validation + OIDC for second hop | Same session check. Adds OIDC for `dc-notion-sync-api`. |
| **Engine API** | `X-Admin-Key` header | Guards destructive ops only. No user identity. |
| **Notion Sync API** | `X-API-Key` header | All endpoints except `/health`. Bypassed if env var unset. |
| **Portal API** | `X-DC-User-Email` header | Trusts hub. Auto-creates users. Syncs admin role from `X-DC-Admin`. |

### Session Details

- **Cookie**: `dc_session` — HttpOnly, Secure, SameSite=Lax, Path=/
- **TTL**: 30 days
- **Storage**: `auth_sessions` table (id: UUID PK, email, expires_at, created_at)
- **User table**: `auth_users` (email unique, status: pending/approved/revoked)

### Admin Determination

```python
DC_ADMIN_EMAILS = {"masterxavuga@gmail.com"}
```

### IAM

- Service account: `dc-hub-invoker@dc-solar-leads.iam.gserviceaccount.com`
- Compute SA: `216566158850-compute@developer.gserviceaccount.com`
- Both have `roles/run.invoker` on all 4 Cloud Run services

---

## Hub Backend Endpoints

| Route | Purpose |
|-------|---------|
| `/api/auth/login` | Initiates Google OAuth |
| `/api/auth/callback` | OAuth callback, creates session |
| `/api/auth/me` | Returns current user from session |
| `/api/auth/logout` | Clears session |
| `/api/admin/users` | List approved users (requires admin secret) |
| `/api/admin/add-user` | Whitelist a user |
| `/api/admin/revoke` | Revoke user access |
| `/api/health` | Hub health check |
| `/api/status/deployments` | CF Pages + Cloud Run deploy timestamps |
| `/api/portal/*` | Proxy to `dc-portal-api` (via `PARTNER_API_URL`) |
| `/api/pipeline/*` | Proxy to `dc-notion-sync-api` (via `DC_ASYNC_URL`) |

---

## Key Files

| File | Purpose |
|------|---------|
| `functions/_middleware.ts` | Session cookie check, public path allowlist |
| `functions/_lib/gcp-auth.ts` | OIDC token generation for CF Functions |
| `functions/api/[[path]].ts` | Hub API proxy to Cloud Run |
| `functions/api/engine/[[path]].ts` | Engine API proxy |
| `functions/api/notion-sync/[[path]].ts` | Notion Sync API proxy |
| `functions/api/portal/health/[[path]].ts` | Portal health proxy (direct) |
| `functions/engine/[[path]].ts` | Engine frontend proxy |
| `functions/notion-sync/[[path]].ts` | Notion Sync frontend proxy |
| `functions/portal/[[path]].ts` | Portal frontend proxy |
| `functions/bd-tools/[[path]].ts` | BD Tools frontend proxy |
| `functions/_lib/home-button.ts` | Floating home button injected into proxied HTML |
| `src/config/projects.config.ts` | Project registry (names, URLs, routes) |
| `backend/hub_api/main.py` | FastAPI entry point |
| `backend/hub_api/routes/auth.py` | Google OAuth flow |
| `backend/hub_api/routes/partner.py` | Portal proxy with identity injection |
| `backend/hub_api/routes/pipeline.py` | Notion Sync proxy |
| `backend/hub_api/routes/deployments.py` | Deploy status API |
| `backend/hub_api/config.py` | Backend settings from env vars |

---

## Environment Variables

### CF Pages (dc-hub)

| Variable | Purpose |
|----------|---------|
| `GCP_SERVICE_ACCOUNT_KEY` | Service account JSON for OIDC token generation |

### Cloud Run (dc-hub-api)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `GOOGLE_CLIENT_ID` | Google OAuth (from Secret Manager) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth (from Secret Manager) |
| `GOOGLE_REDIRECT_URI` | `https://dc-hub.pages.dev/api/auth/callback` |
| `ADMIN_SECRET` | Secret for admin API endpoints |
| `CORS_ORIGINS` | `https://dc-hub.pages.dev` |
| `DC_ASYNC_URL` | `https://dc-notion-sync-api-bz6s4nkt4q-uc.a.run.app` |
| `PARTNER_API_URL` | `https://dc-portal-api-bz6s4nkt4q-uc.a.run.app` |
| `CLOUDFLARE_API_TOKEN` | For deployment status queries |
| `CLOUDFLARE_ACCOUNT_ID` | For deployment status queries |

---

## Security Observations

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | Engine has no user auth — all requests treated equally | Medium | Acceptable for single-tenant |
| 2 | Portal trusts `X-DC-User-Email` header blindly | High | Mitigated by GCP OIDC on Cloud Run |
| 3 | Notion Sync auth bypassed when `API_KEY` env var unset | Medium | Must verify prod config |
| 4 | Portal CORS defaults to `*` | Medium | Set to `https://dc-hub.pages.dev` in prod |
| 5 | Exposed Notion token in `dc_async/.env` committed to repo | High | Must revoke and rotate |

---

## Notes & Decisions

- **2026-03-19**: Hub redesign — replaced 1008-line dashboard home with clean navigation hub. Dashboard moved to `/performance/`. New pages: `/docs/` (renders markdown), `/projects/` (target=_blank links). Updated nav: Home | Docs | Performance | Projects | Admin.
- **2026-03-19**: Logo fix — replaced typed "DaisyChain" (JetBrains Mono) with horizontal lockup image per brand manual.
- **2026-03-19**: Added floating home button injection to all frontend proxy functions via `functions/_lib/home-button.ts`.
- **2026-03-19**: Full rename — CF Pages projects (`dc-engine`, `dc-notion-sync`, `dc-portal`, `dc-bd-tools`), Cloud Run services (`dc-engine-api`, `dc-notion-sync-api`, `dc-portal-api`, `dc-hub-api`). All container-based deploys.
- **2026-03-19**: Deleted old CF Pages projects and Cloud Run services. Deleted `dc-hub-gateway` worker.
- **2026-03-19**: Created `ARCHITECTURE_BASE_PATH.md` — defines `VITE_BASE_PATH` env var pattern to eliminate hardcoded paths.
- **2026-03-18**: Initial endpoint & auth audit. Fixed path detection, OIDC gaps, consolidated dashboard.
- **Architecture choice**: Hub gateway handles all auth; downstream services trust headers. Single point of trust.
- **CF Worker deleted**: The `worker/` directory contained an old KV-based magic link auth system, superseded by Google OAuth + CF Pages Functions.
