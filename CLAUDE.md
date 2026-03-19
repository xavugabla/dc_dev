## Base Path Architecture

This project follows the DaisyChain Base Path Architecture. See `ARCHITECTURE_BASE_PATH.md` for the full specification.

Key rules:
- Vite `base` is set from `VITE_BASE_PATH` env var (defaults to `/` for local dev)
- Router base uses `import.meta.env.BASE_URL`
- API base uses `VITE_API_BASE` env var (defaults to `/api` for local dev)
- Source HTML uses relative paths only (`./`, never `/`) — applies to sub-apps; the hub itself is always at root
- No `window.location.pathname` detection logic

## Hub Structure

The hub (this repo) is an Astro static site with Cloudflare Pages Functions for proxying.

### Pages
- `/` — Home: clean navigation hub with 4 cards (Docs, Performance, Projects, Admin)
- `/docs/` — Documentation index with subpages rendering markdown from `docs/`
- `/performance/` — System health dashboard (API health checks, latency, metrics)
- `/projects/` — Project cards with `target="_blank"` links to child SPAs
- `/admin/` — User management (requires admin key)
- `/login/` — Google OAuth sign-in

### Navigation
Header nav: Home | Docs | Performance | Projects | Admin

### Proxy Functions (`functions/`)
Each child SPA is proxied via Cloudflare Pages Functions at `/{slug}/`:
- `functions/{slug}/[[path]].ts` — frontend proxy (strips prefix, SPA fallback)
- `functions/api/{slug}/[[path]].ts` — API proxy (strips prefix, adds GCP auth)
- All frontend proxies inject a floating home button via `functions/_lib/home-button.ts`

### Project Configuration
`src/config/projects.config.ts` is the single source of truth for onboarded projects.
