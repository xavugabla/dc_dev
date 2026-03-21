# Dev Parity: Local Dev ↔ Production

How to develop DaisyChain apps locally with confidence that changes will work in production.

## The Problem

In production, every app routes through the hub gateway:

```
Browser → dc-hub.pages.dev/engine/assets/logo.png
       → CF Function strips /engine → dc-engine.pages.dev/assets/logo.png

Browser → dc-hub.pages.dev/api/engine/api/graphs
       → CF Function strips /api/engine → dc-engine-api (Cloud Run) /api/graphs
```

Locally, there's no gateway — apps run standalone:

```
Browser → localhost:5000/assets/logo.png
       → Vite serves directly

Browser → localhost:5000/api/graphs
       → Vite proxy → localhost:8001/api/graphs
```

The **base paths are different** (`/engine/` vs `/`), the **API prefixes are different** (`/api/engine/api` vs `/api`), and there's a proxy layer in production that doesn't exist locally. This makes it hard to trust that local changes will work through the hub.

## The Two-Mode Architecture

Every DaisyChain app runs in two modes, controlled entirely by environment variables:

| Mode | `VITE_BASE_PATH` | `VITE_API_BASE` | How API reaches backend |
|------|-------------------|-----------------|------------------------|
| **Standalone** (local dev) | `/` (default) | `/api` (default) | Vite proxy → localhost |
| **Hub** (production) | `/{slug}/` | `/api/{slug}/api` | CF Function → Cloud Run |

The source code is **identical** in both modes. The Vite `base` config and the API client both read env vars with sensible defaults. No `if (production)` logic anywhere.

### How it works in code

**Frontend asset paths** — Vite handles this automatically:
```html
<!-- source (index.html) -->
<link rel="icon" href="./favicon.png" />

<!-- built output when VITE_BASE_PATH=/ -->
<link rel="icon" href="/favicon.png" />

<!-- built output when VITE_BASE_PATH=/engine/ -->
<link rel="icon" href="/engine/favicon.png" />
```

**Router base** — reads from Vite's injected `BASE_URL`:
```tsx
// App.tsx
<Router base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
```

**API calls** — all go through a single `API_BASE`:
```ts
// lib/api.ts
export const API_BASE = import.meta.env.VITE_API_BASE || '/api';

// usage
fetch(`${API_BASE}/graphs`)
// local:  GET /api/graphs       → Vite proxy → localhost:8001/api/graphs
// prod:   GET /api/engine/api/graphs → CF Function → Cloud Run /api/graphs
```

## Hub-Mode Local Testing

To validate production parity **without deploying**, run the app in hub mode locally. This sets the production env vars but uses a Vite proxy rewrite to strip the hub prefix before forwarding to the local backend:

```
npm run dev:hub
# Frontend: http://localhost:5000/engine/
# API: /api/engine/api/* → proxy rewrites to /api/* → localhost:8001
```

What this tests:
- Asset paths resolve correctly with `/engine/` base
- Router handles the `/engine/` prefix
- API calls go through `/api/engine/api/` and reach the backend
- No hardcoded `/` or `/api/` paths break the app

The proxy rewrite is the key mechanism:
```ts
// vite.config.ts proxy
rewrite: (path) => {
  const strip = process.env.VITE_HUB_STRIP_PREFIX; // "/api/engine"
  if (strip && path.startsWith(strip)) {
    return path.slice(strip.length); // "/api/engine/api/graphs" → "/api/graphs"
  }
  return path;
}
```

This is a **no-op** in normal dev mode (env var not set).

## Request Lifecycle — Side by Side

### Local standalone (`npm run dev:all`)

```
1. Browser requests http://localhost:5000/
2. Vite dev server serves index.html (base=/)
3. React router mounts at /
4. Component fetches /api/graphs
5. Vite proxy forwards to http://localhost:8001/api/graphs
6. FastAPI returns JSON
```

### Local hub mode (`npm run dev:hub`)

```
1. Browser requests http://localhost:5000/engine/
2. Vite dev server serves index.html (base=/engine/)
3. React router mounts at /engine
4. Component fetches /api/engine/api/graphs
5. Vite proxy matches /api, rewrites path → /api/graphs
6. Forwards to http://localhost:8001/api/graphs
7. FastAPI returns JSON
```

### Production (through gateway)

```
1. Browser requests https://dc-hub.pages.dev/engine/
2. CF Function /engine/[[path]].ts proxies to dc-engine.pages.dev/
3. Built index.html has base=/engine/, all assets prefixed
4. React router mounts at /engine
5. Component fetches /api/engine/api/graphs
6. CF Function /api/engine/[[path]].ts strips /api/engine
7. Forwards to dc-engine-api Cloud Run → /api/graphs (with OIDC token)
8. FastAPI returns JSON
```

Steps 3-6 are functionally identical between hub-mode local and production. The only difference is the transport layer (Vite proxy vs. CF Functions + OIDC).

## Port Map

| Service | Port | Used by |
|---------|------|---------|
| Engine frontend (Vite) | 5000 | `npm run dev:all`, `npm run dev:hub` |
| Engine frontend (standalone) | 3000 | `npm run dev:client` |
| Engine backend (FastAPI) | 8001 | All dev modes, Docker, Cloud Run |
| Notion Sync backend | 8002 | dc_async |
| Hub backend | 8003 | dc_dev |
| Portal backend | 8080 | daisychain-partner-portal |
| PostgreSQL | 5432 | Local DB (all projects) |
| PostgreSQL (docker) | 5433 | Docker-mapped external port |

## Environment Variables Reference

### Frontend (Vite, build-time)

| Variable | Default | Production (Engine) | Purpose |
|----------|---------|-------------------|---------|
| `VITE_BASE_PATH` | `/` | `/engine/` | Vite `base` config, asset prefix |
| `VITE_API_BASE` | `/api` | `/api/engine/api` | API client base URL |
| `VITE_HUB_STRIP_PREFIX` | (unset) | n/a (local only) | Proxy rewrite: strip this prefix |
| `VITE_API_PROXY_TARGET` | `http://localhost:8001` | n/a (local only) | Vite dev proxy target |

### Backend (FastAPI, runtime)

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/{db_name}` | PostgreSQL connection |
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:5000` | Allowed CORS origins |
| `ADMIN_API_KEY` | (empty) | Guards destructive endpoints |
| `DEBUG` | `false` | Debug mode |
| `LOG_LEVEL` | `INFO` | Log verbosity |

## Per-Repo Setup

### Engine (`one_click_dc`)

**Status:** Dev parity implemented.

```bash
# Normal dev (standalone mode)
npm run dev:all     # Backend on 8001 + frontend on 5000

# Hub mode (production parity test)
npm run dev:hub     # Same, but with /engine/ base paths

# Frontend only (if backend is running separately)
npm run dev:client  # Vite on port 3000

# Path validation
npm run check:paths # Catches hardcoded paths + hub-mode build test
```

**Database:** Local PostgreSQL on `localhost:5432/one_click_dc`
**Backend:** `cd python && uvicorn calc_service.main:app --port 8001`

### Portal (`daisychain-partner-portal`)

**Status:** Pending — same pattern to be applied.

Hub-mode values:
- `VITE_BASE_PATH=/portal/`
- `VITE_API_BASE=/api/portal`
- `VITE_HUB_STRIP_PREFIX=/api/portal` (note: no trailing `/api` — portal backend routes differ)

### Notion Sync (`dc_async`)

**Status:** Pending — same pattern to be applied.

Hub-mode values:
- `VITE_BASE_PATH=/notion-sync/`
- `VITE_API_BASE=/api/notion-sync`
- `VITE_HUB_STRIP_PREFIX=/api/notion-sync`

### BD Tools (`bd-tools`)

**Status:** No backend, static only. No dev parity concerns beyond asset paths.

## Rules for Keeping Parity

These rules ensure that any code change works in both modes:

1. **Never hardcode `/api/`** in fetch calls — always use `API_BASE` from `lib/api.ts`
2. **Never hardcode asset paths** starting with `/` — use `import.meta.env.BASE_URL` prefix or relative paths (`./`)
3. **Never detect paths at runtime** — no `window.location.pathname.startsWith('/engine')` logic
4. **Source HTML uses relative paths only** — `./favicon.png`, not `/favicon.png`
5. **Router base comes from `BASE_URL`** — never hardcoded
6. **Run `npm run check:paths`** before deploying to catch violations
7. **Test hub mode locally** with `npm run dev:hub` when changing routing, assets, or API client code

## Checklist: Adding Dev Parity to a New Repo

- [ ] Vite config: `base: process.env.VITE_BASE_PATH || '/'`
- [ ] Vite config: proxy for `/api` with `rewrite` supporting `VITE_HUB_STRIP_PREFIX`
- [ ] API client: `API_BASE = import.meta.env.VITE_API_BASE || '/api'`
- [ ] Router: `base={import.meta.env.BASE_URL}`
- [ ] Source HTML: all relative paths (`./`)
- [ ] `scripts/dev-hub.sh` with correct `VITE_BASE_PATH`, `VITE_API_BASE`, `VITE_HUB_STRIP_PREFIX`
- [ ] `scripts/check-paths.sh` for automated validation
- [ ] `.env.example` includes frontend vars (commented out)
- [ ] `package.json` scripts: `dev:all`, `dev:hub`, `check:paths`
- [ ] Verify: `npm run dev:hub` → navigate to `localhost:PORT/{slug}/` → all pages + API work
