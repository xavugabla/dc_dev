# dc-hub-api — Deployment

## Cloud Run Service

| Property | Value |
|----------|-------|
| Service | `dc-hub-api` |
| Region | `us-central1` |
| Project | `dc-solar-leads` |
| Port | `8003` |
| Image | `us-central1-docker.pkg.dev/dc-solar-leads/cloud-run-source-deploy/dc-hub-api:latest` |

## Deploy

From the repo root:

```bash
# Build
docker build -t us-central1-docker.pkg.dev/dc-solar-leads/cloud-run-source-deploy/dc-hub-api:latest -f backend/Dockerfile backend/

# Push
docker push us-central1-docker.pkg.dev/dc-solar-leads/cloud-run-source-deploy/dc-hub-api:latest

# Deploy
gcloud run deploy dc-hub-api \
  --image=us-central1-docker.pkg.dev/dc-solar-leads/cloud-run-source-deploy/dc-hub-api:latest \
  --region=us-central1 --project=dc-solar-leads --quiet
```

Only include `--port=8003` on first deploy. Subsequent deploys inherit the port.

## CF Pages (Frontend)

| Property | Value |
|----------|-------|
| Project | `dc-hub` |
| URL | `dc-hub.pages.dev` |
| Repo | `dc_dev` / `main` |
| Build command | `npm run build` |
| Build output | `dist` |

CF Pages auto-deploys on push to `main`. No manual action needed.

### CF Pages Environment Variables

| Variable | Purpose |
|----------|---------|
| `GCP_SERVICE_ACCOUNT_KEY` | Service account JSON for OIDC tokens to Cloud Run |

## Cloud Run Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `GOOGLE_CLIENT_ID` | Google OAuth (Secret Manager) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth (Secret Manager) |
| `GOOGLE_REDIRECT_URI` | `https://dc-hub.pages.dev/api/auth/callback` |
| `ADMIN_SECRET` | Admin API endpoint auth |
| `CORS_ORIGINS` | `https://dc-hub.pages.dev` |
| `DC_ASYNC_URL` | Notion sync Cloud Run URL |
| `PARTNER_API_URL` | Portal Cloud Run URL |
| `CLOUDFLARE_API_TOKEN` | Deploy status queries |
| `CLOUDFLARE_ACCOUNT_ID` | Deploy status queries |
