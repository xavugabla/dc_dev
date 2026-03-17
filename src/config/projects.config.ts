/**
 * Single source of truth for onboarded projects.
 * Drives both the UI (projects list) and routing configuration.
 *
 * HOW TO ADD A NEW PROJECT
 * ────────────────────────
 * 1. Add an entry to the `projectConfigs` array.
 * 2. Create functions/{slug}/[[path]].ts (frontend proxy).
 * 3. If the project has an API: functions/api/{slug}/[[path]].ts.
 * 4. Update Worker index.ts to route /{slug}/* and /api/{slug}/* when used.
 */
export interface ProjectConfig {
  id: string;
  slug: string;
  name: string;
  description: string;
  details?: string;
  external?: boolean;
  frontend: { origin: string; pathPrefix?: string };
  api?: { origin: string; pathPrefix: string };
}

export const projectConfigs: ProjectConfig[] = [
  {
    id: 'modeling',
    slug: 'modeling',
    name: 'DaisyChain',
    description: 'Energy analysis and utility cost modeling',
    frontend: { origin: 'https://dc-modeling.pages.dev' },
    api: { origin: 'https://one-click-dc-api-216566158850.us-central1.run.app', pathPrefix: '/api/modeling' },
    details:
      'Full-stack energy platform (React + Hono) for building-level utility analysis. ' +
      'Includes calculation graph engine, proposal generation, rate sensitivity modeling, ' +
      'and submeter analytics. Deployed on Cloudflare Pages with a Neon Postgres backend.',
  },
  {
    id: 'notion-sync',
    slug: 'notion-sync',
    name: 'Notion Sync',
    description: 'Notion sync and pipeline analytics',
    frontend: { origin: 'https://notion-sync-7ja.pages.dev' },
    api: { origin: 'https://dc-async-api-216566158850.us-central1.run.app', pathPrefix: '/api/notion-sync' },
    details:
      'Lightweight analytics layer on top of Notion databases. ' +
      'Syncs deal pipeline data via the Notion API and exposes summary endpoints ' +
      'for revenue forecasting and stage-conversion metrics.',
  },
  {
    id: 'partner-portal',
    slug: 'partner-portal',
    name: 'Partner Portal',
    description: 'Vendor and channel partner management',
    frontend: { origin: 'https://dc-partner-portal.pages.dev' },
    api: { origin: 'https://partner-portal-api.us-central1.run.app', pathPrefix: '/api/partner' },
    details:
      'Partner management platform for vendor onboarding, deal pipeline tracking, ' +
      'job management, and resource library. Integrates with Notion for data sync.',
  },
];
