# Deployment Guide

## Architecture

| Component | Platform | Trigger |
|-----------|----------|---------|
| Hub frontend (Astro static) | Cloudflare Pages (`dc-hub`) | Auto on git push to `main` |
| CF Pages Functions (proxies, middleware) | Cloudflare Pages (`dc-hub`) | Auto on git push to `main` |
| Hub API (FastAPI) | Cloud Run (`dc-hub-api`) | Manual `gcloud run deploy` |

## 1. Frontend + Functions (Cloudflare Pages)

Push to `main` → CF Pages auto-builds:

```bash
git push origin main
```

Build command: `npm run build`
Output directory: `dist`

CF Pages Functions in `functions/` are deployed alongside the static output. No separate step needed.

**Verify:** Visit `https://dc-hub.pages.dev` — check nav, pages, and proxy functions.

## 2. Hub API (Cloud Run)

The backend lives in `backend/` and deploys as a container image.

```bash
cd backend

# Build for linux/amd64
docker build --platform linux/amd64 \
  -t us-central1-docker.pkg.dev/dc-solar-leads/cloud-run-source-deploy/dc-hub-api:latest .

# Push to Artifact Registry
docker push us-central1-docker.pkg.dev/dc-solar-leads/cloud-run-source-deploy/dc-hub-api:latest

# Deploy from image
gcloud run deploy dc-hub-api \
  --image us-central1-docker.pkg.dev/dc-solar-leads/cloud-run-source-deploy/dc-hub-api:latest \
  --region us-central1 \
  --project dc-solar-leads
```

First run: `gcloud auth configure-docker us-central1-docker.pkg.dev` to set up Docker credentials.

**Service URL:** `https://dc-hub-api-bz6s4nkt4q-uc.a.run.app`

### When to redeploy Cloud Run

Redeploy after changes to any file under `backend/`:
- `hub_api/routes/` — API route logic (health, auth, admin, deployments, partner, pipeline)
- `hub_api/config.py` — settings / env var mapping
- `hub_api/main.py` — FastAPI app setup
- `requirements.txt` — Python dependencies
- `Dockerfile` — container config

Frontend-only changes (Astro pages, CSS, CF Functions) do **not** require a Cloud Run redeploy.

### Environment variables (Cloud Run)

Set via GCP Console → Cloud Run → dc-hub-api → Edit & Deploy → Variables, or via Secret Manager references:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (Secret Manager) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret (Secret Manager) |
| `GOOGLE_REDIRECT_URI` | `https://dc-hub.pages.dev/api/auth/callback` |
| `ADMIN_SECRET` | Secret key for `/admin` page API access |
| `CORS_ORIGINS` | `https://dc-hub.pages.dev` |
| `DC_ASYNC_URL` | `https://dc-notion-sync-api-bz6s4nkt4q-uc.a.run.app` |
| `PARTNER_API_URL` | `https://dc-portal-api-bz6s4nkt4q-uc.a.run.app` |
| `CLOUDFLARE_API_TOKEN` | CF API token (Pages Read + Workers Scripts Read) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID (32-char hex) |

### Environment variables (CF Pages)

Set in CF Dashboard → dc-hub → Settings → Environment Variables:

| Variable | Purpose |
|----------|---------|
| `GCP_SERVICE_ACCOUNT_KEY` | Service account JSON for OIDC token generation in CF Functions |

## 3. Child projects

Each child SPA deploys independently to its own CF Pages project. The hub proxies their frontends and APIs.

| Project | CF Pages | Cloud Run | Hub routes |
|---------|----------|-----------|------------|
| Engine | `dc-engine` | `dc-engine-api` | `/engine/*`, `/api/engine/*` |
| Notion Sync | `dc-notion-sync` | `dc-notion-sync-api` | `/notion-sync/*`, `/api/notion-sync/*` |
| Portal | `dc-portal` | `dc-portal-api` | `/portal/*`, `/api/portal/*` |
| BD Tools | `dc-bd-tools` | — | `/bd-tools/*` |

Child CF Pages env vars (for Vite sub-apps):
- `VITE_BASE_PATH` — e.g. `/engine/`
- `VITE_API_BASE` — e.g. `/api/engine/api`

See `ARCHITECTURE_BASE_PATH.md` for full spec.

## 4. Onboarding a new project

1. Create CF Pages project `dc-{name}`, set `VITE_BASE_PATH=/{name}/` and `VITE_API_BASE`
2. Add frontend proxy: `functions/{name}/[[path]].ts` (import `injectHomeButton`)
3. Add API proxy: `functions/api/{name}/[[path]].ts` (import `getIdentityToken`)
4. Add entry to `src/config/projects.config.ts`
5. Add entry to `backend/hub_api/routes/deployments.py` `DEPLOY_CONFIG`
6. Push to deploy CF Pages, then `gcloud run deploy` for the backend

## 5. Verification checklist

After deploying:
- [ ] `/` — clean 4-card hub landing
- [ ] `/performance/` — health dashboard loads, checks run
- [ ] `/projects/` — cards render, "Open" opens in new tab
- [ ] `/docs/` — index + subpages render markdown
- [ ] `/engine/` — proxied SPA loads, floating home button visible
- [ ] `/api/health` — returns `{"status": "ok", "database": true}`
- [ ] `/api/status/deployments` — returns deploy times for all projects including bd-tools
- [ ] Header logo shows horizontal lockup (not icon + typed text)
- [ ] Nav reads: Home | Docs | Performance | Projects | Admin

## IAM

- **Service account:** `dc-hub-invoker@dc-solar-leads.iam.gserviceaccount.com`
- **Compute SA:** `216566158850-compute@developer.gserviceaccount.com`
- Both have `roles/run.invoker` on all Cloud Run services
- `GCP_SERVICE_ACCOUNT_KEY` in CF Pages contains the `dc-hub-invoker` key JSON
