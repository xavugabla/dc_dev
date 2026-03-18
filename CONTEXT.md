# DaisyChain Hub — Living Context

> Last updated: 2026-03-18

---

## Platform Overview

| Project | Repo | CF Pages | Cloud Run Service | Port | Status |
|---------|------|----------|-------------------|------|--------|
| **Hub (Gateway)** | `dc_dev` | `dc-hub.pages.dev` | `dc-dev-hub-api` | 8003 | Active |
| **Modeling Engine** | `one_click_dc` | `dc-modeling.pages.dev` | `one-click-dc-api` | 8001 | Active |
| **Notion Sync (CRM)** | `dc_async` | `notion-sync-7ja.pages.dev` | `dc-async-api` | 8002 | Active |
| **Partner Portal** | `daisychain-partner-portal` | `dc-partner-portal.pages.dev` | `partner-portal-api` | 8080 | Active |

**Gateway routing** (all under `dc-hub.pages.dev`):

| Path | Target |
|------|--------|
| `/api/*` | Hub backend (Cloud Run) |
| `/api/modeling/*` | one-click-dc-api |
| `/api/notion-sync/*` | dc-async-api |
| `/api/partner/health/*` | partner-portal-api (health direct) |
| `/api/partner/*` | Hub backend → partner-portal-api (session-gated) |
| `/modeling/*` | dc-modeling.pages.dev (frontend) |
| `/notion-sync/*` | notion-sync-7ja.pages.dev (frontend) |
| `/partner-portal/*` | dc-partner-portal.pages.dev (frontend) |

---

## Current Goals

- Consolidate all apps under the hub gateway with unified Google OAuth
- Endpoint & auth audit across all projects (completed 2026-03-18)
- Harden auth layer — address security observations noted below

---

## Task Tracker

| Task | Status | Notes |
|------|--------|-------|
| Create CONTEXT.md with endpoint/auth audit | Done | This file |
| Fix Modeling Engine gateway path detection | Done | `/proposals` → `/modeling` in `api.ts:55` |
| Fix Notion Sync API base for hub | Done | `/api/crm` → `/api/notion-sync` in `app.js:16` |
| Add OIDC for hub→downstream service-to-service calls | Done | `gcp_auth.py` + `partner.py` + `pipeline.py` |
| Consolidate hub frontend to single-page dashboard | Done | Merged Home/Projects/Status into one page |
| Create per-project CONTEXT.md files | Done | `one_click_dc`, `dc_async`, `daisychain-partner-portal` |
| Deploy Partner Portal backend to Cloud Run | Done | `partner-portal-api-216566158850.us-central1.run.app` |
| Update partner portal Cloud Run URL in configs | Done | `[[path]].ts`, `wrangler.toml`, `projects.config.ts` |
| Set `PARTNER_API_URL` and `DC_ASYNC_URL` env vars on Cloud Run | Done | Set on `dc-dev-hub-api` |
| Verify CORS is locked down in prod for Partner Portal | Todo | Defaults to `*` |
| Verify `API_KEY` is set in dc_async prod | Todo | Auth bypassed if unset |
| Revoke exposed Notion token in dc_async `.env` | Todo | Real token committed to repo |
| Evaluate user-scoped auth for Modeling Engine | Todo | Currently single-tenant only |
| Add cryptographic header verification to Partner Portal | Todo | Currently trusts headers blindly |

---

## Auth Fixes (2026-03-18)

### Issue 1: Modeling Engine — Stale path detection

Frontend at `/modeling/*` was checking `window.location.pathname.startsWith('/proposals')` — always false under the hub. API calls fell through to the hub backend catch-all → 404.

**Fix**: Changed to `.startsWith('/modeling')` with API base `/api/modeling/api`. CF Function strips `/api/modeling`, backend receives `/api/graphs` etc.

### Issue 2: Notion Sync — Wrong API path

Frontend used `/api/crm` when on hub — no such route existed. Also `ROOT_PATH` in `app.py` defaulted to `/api/crm`.

**Fix**: Changed to `/api/notion-sync` (direct CF Function route). Frontend already sends `X-API-Key` from localStorage. Also updated `ROOT_PATH` default.

### Issue 3: Hub backend → downstream OIDC gap

Hub backend's `partner.py` and `pipeline.py` proxied requests to downstream Cloud Run services without GCP OIDC tokens. If those services require authentication (secure default), the second hop fails.

**Fix**: Created `gcp_auth.py` utility using `google-auth` library (already a dependency) to fetch identity tokens from the GCP metadata server. Both proxy routes now inject `Authorization: Bearer {id_token}` before forwarding. Returns `None` gracefully when running locally.

---

## Endpoint & Auth Registry

### A. Modeling Engine (`one_click_dc`)

| Property | Value |
|----------|-------|
| **Framework** | FastAPI (Python) |
| **Port** | 8001 |
| **Total endpoints** | 172 (across 25 router modules) |
| **Auth** | `X-Admin-Key` header — guards DELETE requests, `/api/admin/*`, and bulk `PUT /api/lookups/*/entries` |
| **Auth middleware** | `middleware/api_guard.py` — checks `ADMIN_API_KEY` env var |
| **Hub header reading** | None — does NOT read `X-DC-User-Email` or any identity headers |
| **CORS** | Configurable via `CORS_ORIGINS` env var; defaults to `localhost:3000`, `localhost:5000` |
| **Health endpoints** | `/health`, `/health/detailed`, `/api/health/metrics`, `/api/health/metrics/slow`, `/api/health/metrics/benchmark` |
| **Database** | Neon PostgreSQL via SQLAlchemy |

<details>
<summary>Router modules (25 files, 172 endpoints)</summary>

| Router file | Endpoints |
|-------------|-----------|
| admin.py | 2 |
| crud_buildings.py | 14 |
| crud_energy_profiles.py | 11 |
| crud_entities.py | 9 |
| crud_graphs.py | 3 |
| crud_load_aggregation.py | 8 |
| crud_lookups.py | 12 |
| crud_node_library.py | 14 |
| crud_registries.py | 8 |
| crud_runs.py | 9 |
| crud_slots.py | 7 |
| crud_tariffs.py | 16 |
| crud_visualization.py | 4 |
| csv_ingest.py | 3 |
| derivation.py | 3 |
| explanation.py | 4 |
| graphs.py | 11 |
| health.py | 5 |
| lookups.py | 4 |
| nodes.py | 4 |
| pdf.py | 4 |
| pipeline.py | 2 |
| rate_switching.py | 4 |
| sensitivity.py | 2 |
| submetering.py | 8 |
| *main.py (root)* | 1 |

</details>

**Key concern**: No row-level security or user-scoped data filtering. Suitable for single-tenant but risky if multi-tenant needed.

---

### B. Notion Sync / CRM (`dc_async`)

| Property | Value |
|----------|-------|
| **Framework** | FastAPI (Python) |
| **Port** | 8002 |
| **Total endpoints** | 13 (across 5 route modules) |
| **Auth** | `X-API-Key` header — required on all endpoints except `/health` |
| **Auth bypass** | If `API_KEY` env var is unset, auth is **skipped** (dev mode) |
| **Auth file** | `src/api/auth.py` |
| **Hub header reading** | None — does NOT read `X-DC-User-Email` |
| **CORS** | Hardcoded defaults: `dc-dev-hub.pages.dev`, `notion-sync-7ja.pages.dev`, `localhost:3000`; overridable via `CORS_ORIGINS` |
| **Health endpoints** | `/health` (checks Notion client + DB connectivity) |
| **Database** | Read-only access to shared Neon PostgreSQL |

<details>
<summary>Route modules (5 files, 13 endpoints)</summary>

| Route module | Endpoints |
|--------------|-----------|
| health_routes.py | 1 |
| pipeline_routes.py | 4 |
| buildings_routes.py | 2 |
| scripts_routes.py | 4 |
| reports_routes.py | 2 |

</details>

**Key concerns**:
- `.env` contains an exposed Notion token (`ntn_...`) committed to repo — **must revoke and rotate**
- Auth bypassed when `API_KEY` unset — verify prod has it set

---

### C. Partner Portal (`daisychain-partner-portal`)

| Property | Value |
|----------|-------|
| **Framework** | Express.js (TypeScript) |
| **Port** | 8080 |
| **Total endpoints** | 145 (across 17 route modules) |
| **Auth** | Header-based — reads `X-DC-User-Email` (required) and `X-DC-Admin` (role sync) |
| **Auth middleware** | `server/index.ts` lines 35–67 — applied to all `/api` routes |
| **Auto-creates users** | If email from header doesn't exist, creates user with UUID-based ID |
| **Role sync** | Admin status synced from `X-DC-Admin` header on every request |
| **RBAC** | `admin` (full access) vs `regular` (own data only); `requireAdmin` middleware in `routes.ts` |
| **CORS** | `CORS_ORIGIN` env var, **defaults to `*`** |
| **Health endpoints** | 6: `/health`, `/health/database`, `/health/storage`, `/health/notion`, `/health/comprehensive`, `POST /health/test-endpoint` |
| **Session management** | None — fully stateless, relies 100% on hub gateway headers |

<details>
<summary>Route modules (17 files, 145 endpoints)</summary>

| Route module | Endpoints |
|--------------|-----------|
| routes.ts | 27 |
| routes-notion-admin.ts | 16 |
| routes-proposals.ts | 11 |
| routes-database-schema-manager.ts | 10 |
| routes-enhanced-pipeline.ts | 9 |
| routes-schema-admin.ts | 9 |
| routes-simple-pages.ts | 9 |
| routes-schema-configurator.ts | 8 |
| routes-schema-dominator.ts | 7 |
| routes-database-linking.ts | 6 |
| routes-health.ts | 6 |
| routes-pipeline-orchestration.ts | 6 |
| routes-notion-field-mapping.ts | 5 |
| routes-pipeline.ts | 5 |
| routes-pages-manager.ts | 5 |
| routes-test-reports.ts | 4 |
| routes-functionality-tests.ts | 2 |

</details>

**Key concern**: Trusts `X-DC-User-Email` header without cryptographic verification. Secure only because Cloud Run requires GCP OIDC (blocks direct public access).

---

## Auth Architecture

### Layer-by-Layer Flow

```
Browser → CF Pages Middleware → CF Functions → Cloud Run (via OIDC) → Backend
```

| Layer | Mechanism | Details |
|-------|-----------|---------|
| **CF Pages Middleware** | `dc_session` cookie check | Presence-only check; redirects to `/login` if missing. No KV or env vars. |
| **CF Functions → Cloud Run** | GCP OIDC token | RS256 JWT signed with service account, exchanged for Google identity token. Cached with 5-min refresh buffer. |
| **Hub Backend (partner proxy)** | Session validation in Postgres + OIDC for second hop | Looks up `auth_sessions` table by UUID session ID, checks `expires_at`. Injects `X-DC-User-Email` + `X-DC-Admin` headers. Adds GCP OIDC token for downstream Cloud Run call. |
| **Hub Backend (pipeline proxy)** | Session validation + OIDC for second hop | Same session check. Adds GCP OIDC for dc-async Cloud Run call. |
| **Modeling API** | `X-Admin-Key` header | Guards destructive ops only. No user identity. |
| **Notion Sync API** | `X-API-Key` header | All endpoints except `/health`. Bypassed if env var unset. |
| **Partner Portal API** | `X-DC-User-Email` header | Trusts hub. Auto-creates users. Syncs admin role from `X-DC-Admin`. |

### Session Details

- **Cookie**: `dc_session` — HttpOnly, Secure, SameSite=Lax, Path=/
- **TTL**: 30 days (configurable via `session_ttl` env var)
- **Storage**: `auth_sessions` table (id: UUID PK, email, expires_at, created_at)
- **User table**: `auth_users` (email unique, status: pending/approved/revoked)

### Admin Determination

```python
DC_ADMIN_EMAILS = {"masterxavuga@gmail.com"}
# In partner proxy: x-dc-admin = "true" if email in DC_ADMIN_EMAILS else "false"
```

### Two Gateway Deployment Paths

1. **CF Pages Functions** (primary): `functions/` directory — routes via file-based routing
2. **CF Worker** (alternative): `worker/src/index.ts` — KV-based sessions, magic link auth, admin API

---

## Security Observations

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | Modeling Engine has no user auth — all requests treated equally | Medium | Acceptable for single-tenant |
| 2 | Partner Portal trusts `X-DC-User-Email` header blindly — no cryptographic verification | High | Mitigated by GCP OIDC on Cloud Run |
| 3 | Notion Sync auth bypassed when `API_KEY` env var unset | Medium | Must verify prod config |
| 4 | Partner Portal CORS defaults to `*` (all origins) | Medium | Lock down in prod |
| 5 | Exposed Notion token in `dc_async/.env` committed to repo | High | Must revoke and rotate |
| 6 | No row-level security in Modeling Engine | Low | Risk increases if multi-tenant |

---

## Notes & Decisions

- **2026-03-18**: Initial endpoint & auth audit completed. Verified counts against actual route files across all 3 gatekept projects.
- **2026-03-18**: Fixed 3 auth/routing issues — Modeling path detection, Notion Sync API base, and OIDC gap on hub-to-downstream proxy calls.
- **2026-03-18**: Consolidated hub frontend from 3 pages (Home, Projects, Status) to a single dashboard page with project gates, performance monitoring, and documentation. Old URLs redirect to `/`.
- **2026-03-18**: Created per-project CONTEXT.md files for `one_click_dc`, `dc_async`, and `daisychain-partner-portal`.
- **Architecture choice**: Hub gateway handles all auth; downstream services trust headers. This simplifies backends but creates a single point of trust.
- **Two gateway paths exist**: CF Pages Functions (primary) and CF Worker (alternative with KV sessions + magic links). Need to decide if both are needed long-term.
- **Env var requirement**: `PARTNER_API_URL` and `DC_ASYNC_URL` must be set on the hub backend Cloud Run service to the actual Cloud Run URLs. Defaults are localhost for local dev.
