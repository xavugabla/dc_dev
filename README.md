# dc_dev

Dev tools and project hub. Hosted on [Cloudflare Pages](https://pages.cloudflare.com).

## Structure

- **Home** (`/`) – Landing and quick links
- **Projects** (`/projects/`) – Links to hosted projects (other repos)
- **Login** (`/login/`) – Sign-in placeholder (wire to your auth provider)

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

## Deploy to Cloudflare Pages

1. Push to GitHub (or GitLab).
2. In [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Select this repo and configure:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** (leave default)

Deploys run automatically on push to your production branch.
