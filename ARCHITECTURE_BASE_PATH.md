# Base Path Architecture — DaisyChain Platform

## Problem

Sub-apps are served through the dc-hub proxy at subpaths (`/engine/`, `/portal/`, etc.).
Hardcoded absolute paths (`/assets/...`, `/api/...`) break when proxied.
Runtime detection (`window.location.pathname.startsWith(...)`) is fragile and creates branching logic.

## Solution

Each sub-app receives its deployment base path via a single build-time environment variable.
All path references derive from that variable. Zero hardcoded paths in source code.

## Implementation

### 1. CF Pages Environment Variable

Set in CF Pages dashboard → Settings → Environment Variables (Production & Preview):

| CF Pages Project | Variable | Value |
|---|---|---|
| dc-engine | `VITE_BASE_PATH` | `/engine/` |
| dc-portal | `VITE_BASE_PATH` | `/portal/` |
| dc-notion-sync | N/A (static HTML, uses relative paths natively) | — |
| dc-bd-tools | N/A (static HTML, uses relative paths natively) | — |

Local development: variable is NOT set, defaults to `/`.

### 2. Vite Config

```ts
// vite.config.ts
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  // ... rest of config
});
```

This controls all asset paths in the build output. Vite transforms every `src`, `href`,
and `url()` reference in processed files to use this base.

### 3. Router Base

```tsx
// App.tsx
<Router base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
```

`import.meta.env.BASE_URL` is injected by Vite at build time from the `base` config.
The trailing slash is stripped because wouter expects `/engine` not `/engine/`.

DELETE any `window.location.pathname.startsWith(...)` detection logic.

### 4. API Base

```ts
// lib/api.ts or lib/queryClient.ts
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const API_BASE = `${BASE}/api`;
```

This produces:
- CF Pages build: `/engine/api` → hub catches at `/api/engine/*` via proxy
- Local dev: `/api` → Vite dev proxy forwards to local backend

Wait — this needs clarification. The hub proxy chain is:

```
Browser: /api/engine/api/graphs
  → CF Function (strips /api/engine): /api/graphs
    → Cloud Run backend: /api/graphs
```

So the frontend API base when deployed under the hub must be `/api/engine/api`.
When local, it must be `/api`.

The pattern:

```ts
// For apps whose backend routes are prefixed with /api (engine, portal)
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');  // '/engine' or ''
const API_BASE = BASE ? `/api${BASE}/api` : '/api';
```

Or more cleanly, use a second env var:

```ts
// Set VITE_API_BASE in CF Pages alongside VITE_BASE_PATH
const API_BASE = import.meta.env.VITE_API_BASE || '/api';
```

| CF Pages Project | `VITE_API_BASE` value |
|---|---|
| dc-engine | `/api/engine/api` |
| dc-portal | `/api/portal` |

This is explicit, no derivation logic, no string manipulation.

### 5. Source HTML (index.html)

Use relative paths for everything in the source `index.html`:

```html
<link rel="icon" href="./favicon.png" />
<script type="module" src="./src/main.tsx"></script>
```

Vite rewrites these at build time based on `base`. Never use absolute paths here.

### 6. Static Assets in Code

For images imported in components, use Vite's asset handling:

```tsx
import logo from '@assets/logo.png';  // Vite resolves this
<img src={logo} />
```

For public directory assets referenced in code:

```tsx
const src = `${import.meta.env.BASE_URL}favicon.png`;
```

### 7. Notion-Sync (dc_async) — Static HTML Pattern

No Vite, so the pattern is different. The frontend uses vanilla JS with manual API detection:

```js
const API_BASE = location.hostname.includes('dc-hub')
  ? '/api/notion-sync'
  : '/api';
```

This is the ONE exception where runtime detection is acceptable — there's no build step
to inject variables. Keep this pattern for non-Vite static frontends.

All asset references (`href`, `src`) must use relative paths (`./style.css`, not `/style.css`).

## Verification Checklist

After implementing, verify:

1. `npx vite build` → check `dist/public/index.html` → all `src`/`href` should start with
   the base path (e.g., `/engine/assets/...`) or be relative (`./`)
2. `npm run dev` → app loads at `localhost:3000/` → API calls hit local backend
3. Push to repo → CF Pages builds → visit `dc-hub.pages.dev/{app}/` → app loads,
   assets resolve, API calls work
4. `grep -r 'startsWith.*engine\|startsWith.*portal\|startsWith.*modeling' client/src/` → zero results

## Onboarding a New Project

1. Create CF Pages project with name `dc-{name}`
2. Set `VITE_BASE_PATH=/{name}/` and `VITE_API_BASE=/api/{name}/api` in CF Pages env vars
3. Add proxy function in dc-hub at `functions/{name}/[[path]].ts`
   - Import and apply `injectHomeButton` from `functions/_lib/home-button.ts` to HTML responses
4. Add API proxy function at `functions/api/{name}/[[path]].ts`
5. Add project to `src/config/projects.config.ts` in dc-hub
6. Follow this spec for Vite config, router, and API base in the new project

## What NOT to Do

- Do NOT use `window.location.pathname` to detect deployment context
- Do NOT hardcode `/engine/`, `/portal/`, or any path string in source code
- Do NOT use absolute paths (`/assets/...`, `/favicon.png`) in source HTML
- Do NOT set `base` to a hardcoded string in vite.config.ts — always use the env var
