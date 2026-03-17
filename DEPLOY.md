# Deployment guide

## Overview

- **Hub** (this repo) → Cloudflare Pages
- **Worker** (gateway) → Cloudflare Workers (auth + routing)
- **DaisyChain (dc-modeling)** → Separate Pages project (routed under `/modeling/`)

## 1. Create KV namespace

```bash
cd worker
npm install
npx wrangler kv namespace create AUTH
```

Copy the `id` from the output and update `worker/wrangler.toml`:

```toml
kv_namespaces = [
  { binding = "AUTH", id = "YOUR_KV_ID_HERE" }
]
```

## 2. Deploy the hub to Cloudflare Pages

1. Push this repo to GitHub.
2. In [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Select this repo.
4. Configure:
   - **Project name:** `dc-hub` (note the resulting `*.pages.dev` URL)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** (leave default)
5. Deploy. Note the URL, e.g. `https://dc-hub.pages.dev`.

## 3. Deploy DaisyChain (dc-modeling, separate project)

1. Create a new Pages project for the `one_click_dc` repo.
2. Configure the project name as `dc-modeling` (or note the resulting `*.pages.dev` URL).
3. Deploy. Note the URL, e.g. `https://dc-modeling.pages.dev`.

## 4. Deploy the Worker

1. Create the KV namespace (if not done):

```bash
cd worker
npx wrangler kv namespace create AUTH
```

Copy the `id` from the output into `worker/wrangler.toml` under `kv_namespaces`.

2. Set the admin secret (never commit this):

```bash
npx wrangler secret put ADMIN_SECRET   # Enter a strong random string; you'll use this to access /admin
```

3. Update `worker/wrangler.toml`:

```toml
[vars]
HUB_ORIGIN = "https://dc-hub.pages.dev"          # Your hub Pages URL
MODELING_ORIGIN = "https://dc-modeling.pages.dev"     # DaisyChain frontend
```

4. Deploy:

```bash
npx wrangler deploy
```

5. Add the Worker route:
   - **Workers & Pages** → **Workers** → select `dc-hub-gateway`
   - **Settings** → **Triggers** → **Add route**
   - **Route:** `dc-dev.pages.dev/*` (or your custom domain)
   - **Zone:** Select the zone that owns the domain

   For `*.pages.dev`, the route is added via the Pages project:
   - Go to the **dc-dev** Pages project (the one currently at dc-dev.pages.dev)
   - **Settings** → **Functions** → **Worker routes** (or similar)
   - Or in **Workers** → **Overview** → **Add route** → `dc-dev.pages.dev/*`

   Note: To use `dc-dev.pages.dev` with the Worker, you need the Worker to run on that domain. The `dc-dev` Pages project owns that domain. You may need to:
   - Use a **custom domain** (e.g. `dc-dev.example.com`) on your zone, and add the Worker route there, OR
   - Use Cloudflare's **Workers for Platforms** / **Custom Domains** to attach the Worker to the Pages project's domain.

   For `*.pages.dev` subdomains, the typical approach is to add a **Custom Domain** to your Pages project (e.g. `hub.yourdomain.com`), then add the Worker route on that domain. If you only have `dc-dev.pages.dev`, check [Cloudflare docs](https://developers.cloudflare.com/workers/configuration/routing/routes/) for attaching Workers to Pages.

## 5. Point dc-dev.pages.dev at the Worker

The `dc-dev` Pages project currently serves One Click DC. To switch:

1. **Option A – Same domain, Worker in front**
   - Add Worker route: `dc-dev.pages.dev/*` → `dc-dev-gateway`
   - The Worker will fetch from `dc-hub` and `dc-modeling` based on path.

2. **Option B – New hub project, then Worker**
   - Create `dc-dev-hub` Pages project (builds this repo).
   - Create `dc-modeling` Pages project (builds one_click_dc repo).
   - Change the `dc-dev` project's build to a no-op or delete it.
   - Add Worker route on `dc-dev.pages.dev` pointing to your Worker.
   - Worker fetches from `dc-hub.pages.dev` and `dc-modeling.pages.dev`.

## 6. Admin access

- **URL:** `https://dc-dev.pages.dev/admin?key=YOUR_ADMIN_SECRET`
- Approve pending requests and copy the magic link to send to users.
- Keep `ADMIN_SECRET` private.

## Auth flow

1. User visits site → redirected to `/login` if not authenticated.
2. User submits "Request access" (email + optional message).
3. Admin visits `/admin?key=SECRET`, sees pending requests.
4. Admin clicks "Approve" → magic link is generated.
5. Admin sends the link to the user (Slack, email, etc.).
6. User clicks the link → session cookie is set → access granted.
