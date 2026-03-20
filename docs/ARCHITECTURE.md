# DC Hub Architecture

This repo (`dc_dev`) is the **gatekeeper platform** — a hosting hub that provides auth, performance metrics, documentation, and access to onboarded projects.

## Overview

| Layer | Technology | Deployment |
|-------|------------|------------|
| Frontend | Astro (static) | Cloudflare Pages (`dc-hub`) |
| Backend API | Python (FastAPI) | GCP Cloud Run (`dc-hub-api`) |
| Functions | CF Pages Functions | Co-deployed with Pages |

## Responsibilities

- **dc-hub (this repo)**: Hub UI (home, docs, performance, projects, admin, login), auth flow, project routing.
- **Backend (Cloud Run)**: Session persistence, Google OAuth, partner/pipeline API proxy, health checks, admin endpoints, deployment status.
- **CF Pages Functions**: Auth middleware (session cookie), frontend proxies (with home button injection), API proxies (with OIDC tokens).

## Onboarded Projects

| Slug | Product Name | Repo | CF Pages | CF Pages URL | API (Cloud Run) | Hub Route |
|------|-------------|------|----------|-------------|-----------------|-----------|
| engine | Energy Modeling | `one_click_dc` | `dc-engine` | `dc-engine.pages.dev` | `dc-engine-api` | `/engine/*` |
| notion-sync | Notion Pipeline | `dc_async` | `dc-notion-sync` | `dc-notion-sync.pages.dev` | `dc-notion-sync-api` | `/notion-sync/*` |
| portal | Partner Portal | `daisychain-partner-portal` | `dc-portal` | `dc-portal.pages.dev` | `dc-portal-api` | `/portal/*` |
| bd-tools | BD Tools | `bd-tools` | `dc-bd-tools` | `dc-bd-tools.pages.dev` | — (static) | `/bd-tools/*` |

## Request Flow

1. User → `dc-hub.pages.dev` → CF Pages Functions middleware checks `dc_session` cookie.
2. No session → redirect to `/login` → Google OAuth → session created.
3. Hub pages (`/`, `/docs/`, `/performance/`, `/projects/`, `/admin/`) served directly by Astro.
4. Project frontends (`/engine/*`, `/notion-sync/*`, `/portal/*`, `/bd-tools/*`) proxied to respective CF Pages origins via `functions/{slug}/[[path]].ts`.
5. API calls (`/api/engine/*`, `/api/notion-sync/*`, `/api/portal/*`) proxied to Cloud Run via `functions/api/{slug}/[[path]].ts` with OIDC tokens.
6. Hub's own API (`/api/health`, `/api/auth/*`, `/api/admin/*`) proxied to `dc-hub-api` Cloud Run.
7. Pipeline and portal API calls are double-hopped: CF Function → `dc-hub-api` → target Cloud Run service (with OIDC + session validation).

## Auth Model

| Layer | Mechanism |
|-------|-----------|
| User → CF Pages | `dc_session` cookie (checked by `_middleware.ts`) |
| CF Function → Cloud Run | OIDC token from `GCP_SERVICE_ACCOUNT_KEY` (SA: `dc-hub-invoker`) |
| Hub API → other Cloud Run | OIDC token from default compute SA |
| Notion-sync app-level | `X-API-Key` header (env: `API_KEY`) |
| Portal user identity | `X-DC-User-Email` + `X-DC-Admin` headers injected by hub API |

## Adding a New Project

1. Add entry to `src/config/projects.config.ts` with slug, name, frontend URL, API URL, health endpoint.
2. Create `functions/{slug}/[[path]].ts` — proxy to project's CF Pages URL (use `_lib/home-button.ts` for injection).
3. Create `functions/api/{slug}/[[path]].ts` — proxy to project's Cloud Run URL with OIDC auth.
4. If the project API needs hub-level session gating (double-hop), add a proxy route in `backend/hub_api/routes/`.
5. Grant `dc-hub-invoker` SA and default compute SA `roles/run.invoker` on the new Cloud Run service.
6. Set `VITE_BASE_PATH=/{slug}/` and `VITE_API_BASE=/api/{slug}` in the project's CF Pages env vars.

## Directory Layout

- `src/` — Astro frontend (pages, layouts, config).
- `backend/` — Python hub API (Cloud Run).
- `functions/` — CF Pages Functions (middleware, proxies, auth lib).
- `docs/` — Markdown documents rendered by the docs page.
- `dist/` — Astro build output (gitignored).
