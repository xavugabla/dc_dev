# dc-hub

Gatekeeper platform—hosting hub for auth, performance metrics, and project access. Frontend in `src/`, backend in `backend/` (Cloud Run). Hosted on [Cloudflare Pages](https://pages.cloudflare.com) with Pages Functions for routing. See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Structure

- **Home** (`/`) – Landing and quick links
- **Projects** (`/projects/`) – Links to hosted projects (other repos)
- **Login** (`/login/`) – Request access; you approve and send magic links
- **Admin** (`/admin?key=SECRET`) – Approve pending requests, copy magic links

## Adding projects

Edit `src/config/projects.config.ts` and add entries (see also `docs/ARCHITECTURE.md` for routing setup):

```ts
{
  id: 'my-tool',
  name: 'My Tool',
  description: 'Short description',
  href: '/my-tool/',        // relative path for subdirs
  external: false,          // or true + full URL for external
}
```

For external projects:

```ts
{
  id: 'docs',
  name: 'Docs',
  description: 'Documentation',
  href: 'https://docs.example.com',
  external: true,
}
```

## Local dev

```bash
npm install
npm run dev
```

## Quick checks before push

```bash
npm run test   # runs config check + build
```

- **Config check** (`npm run check`): Ensures `functions/` matches `src/config/projects.config.ts` (frontend proxy per slug, API proxy for `/api/engine` and `/api/notion-sync`; `/api/portal` is proxied by the Hub backend).
- **Build**: Astro static build. Backend is deployed separately (Cloud Run).

## Deploy

See **[DEPLOY.md](./DEPLOY.md)** for full setup: hub → Pages, projects under `/engine/`, `/notion-sync/`, `/portal/`, `/bd-tools/`.
