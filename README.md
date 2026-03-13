# dc_dev

Dev tools and project hub. Hosted on [Cloudflare Pages](https://pages.cloudflare.com) with a Worker for auth and routing.

## Structure

- **Home** (`/`) – Landing and quick links
- **Projects** (`/projects/`) – Links to hosted projects (other repos)
- **Login** (`/login/`) – Request access; you approve and send magic links
- **Admin** (`/admin?key=SECRET`) – Approve pending requests, copy magic links

## Adding projects

Edit `src/config/projects.ts` and add entries:

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

## Deploy

See **[DEPLOY.md](./DEPLOY.md)** for full setup: hub → Pages, Worker → auth + routing, One Click DC under `/one-click-dc/`.
