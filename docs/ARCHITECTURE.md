# DC Hub Architecture

This repo (`dc_dev`) is the **gatekeeper platform**—a hosting hub that provides auth, performance metrics, documentation, and access to onboarded projects.

## Overview

| Layer | Technology | Deployment |
|-------|------------|------------|
| Frontend | Astro (static) | Cloudflare Pages (`dc-hub`) |
| Backend API | Python (FastAPI) | GCP Cloud Run (`dc-dev-hub-api`) |
| Gateway | Cloudflare Worker | Cloudflare Workers (`dc-hub-gateway`) |
| Functions | CF Pages Functions | Co-deployed with Pages |

## Responsibilities

- **dc-hub (this repo)**: Hub UI (home, projects, status, login, admin), auth flow, project routing.
- **dc-hub-gateway (Worker)**: Session validation (KV), magic links, admin API, routing to project frontends/APIs when used as entry point.
- **Backend (Cloud Run)**: Session persistence, partner API proxy, health checks, admin endpoints.
- **Project frontends**: Hosted on separate CF Pages (dc-modeling, notion-sync-7ja, dc-partner-portal).
- **Project APIs**: Hosted on Cloud Run (one-click-dc-api, dc-async-api, partner-portal-api).

## Onboarded Projects

| Slug | Product Name | Repo | CF Pages | API (Cloud Run) |
|------|--------------|------|----------|-----------------|
| modeling | DaisyChain | one_click_dc | dc-modeling | one-click-dc-api |
| notion-sync | Notion Sync | dc_async | notion-sync-7ja | dc-async-api |
| partner-portal | Partner Portal | — | dc-partner-portal | partner-portal-api |

## Request Flow

1. **Without Worker**: User → dc-hub.pages.dev → CF Pages Functions → Hub API (Cloud Run) or project APIs (Cloud Run).
2. **With Worker**: User → custom domain → Worker → HUB_ORIGIN (dc-hub) or project origins; Worker handles auth and routes accordingly.
3. **Project access**: `/modeling/`, `/notion-sync/`, `/partner-portal/` are proxied to respective CF Pages frontends.
4. **API access**: `/api/modeling/*`, `/api/notion-sync/*`, `/api/partner/*` are proxied to respective Cloud Run services.

## Adding a New Project

1. Add an entry to `src/config/projects.ts` (and/or `projects.config.ts` if introduced).
2. Create `functions/{slug}/[[path]].ts` — proxy to project frontend CF Pages URL.
3. Create `functions/api/{slug}/[[path]].ts` — proxy to project Cloud Run API URL (with GCP auth).
4. Update Worker `index.ts` to route `/{slug}/*` and `/api/{slug}/*` when Worker is the entry point.
5. Set env vars in Worker wrangler: `{SLUG}_ORIGIN` for frontend, `{SLUG}_API_ORIGIN` for API if needed.

## Directory Layout

- `src/` — Astro frontend (pages, layouts, config).
- `backend/` — Python hub API (Cloud Run).
- `functions/` — CF Pages Functions (proxies).
- `worker/` — Standalone Cloudflare Worker (auth + routing).
- `dist/` — Astro build output (gitignored).
