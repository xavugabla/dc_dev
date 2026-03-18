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
export interface DeployConfig {
  cloudRun?: { projectId: string; location: string; serviceName: string };
  cloudflarePages?: { accountId: string; projectName: string };
}

export interface ProjectConfig {
  id: string;
  slug: string;
  name: string;
  description: string;
  details?: string;
  external?: boolean;
  frontend: { origin: string; pathPrefix?: string };
  api?: { origin: string; pathPrefix: string };
  /** Extra URLs to ping beyond health (paths or full URLs) */
  endpoints?: string[];
  /** Deploy metadata for fetching last Cloud Run/Cloudflare deploy times */
  deploy?: DeployConfig;
}

/** Platform (Hub) deploy metadata — Hub API, dc-hub Pages, dc-hub-gateway Worker */
export const platformDeployConfig: DeployConfig & { cloudflareWorker?: { accountId: string; scriptName: string } } = {
  cloudRun: { projectId: '216566158850', location: 'us-central1', serviceName: 'dc-dev-hub-api' },
  cloudflarePages: { accountId: '', projectName: 'dc-hub' },
  cloudflareWorker: { accountId: '', scriptName: 'dc-hub-gateway' },
};

export const projectConfigs: ProjectConfig[] = [
  {
    id: 'modeling',
    slug: 'modeling',
    name: 'DaisyChain',
    description: 'Energy analysis and utility cost modeling',
    frontend: { origin: 'https://dc-modeling.pages.dev' },
    api: { origin: 'https://one-click-dc-api-216566158850.us-central1.run.app', pathPrefix: '/api/modeling' },
    endpoints: ['/api/modeling/health/detailed'],
    deploy: {
      cloudRun: { projectId: '216566158850', location: 'us-central1', serviceName: 'one-click-dc-api' },
      cloudflarePages: { accountId: '', projectName: 'dc-modeling' },
    },
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
    endpoints: ['/api/notion-sync/health'],
    deploy: {
      cloudRun: { projectId: '216566158850', location: 'us-central1', serviceName: 'dc-async-api' },
      cloudflarePages: { accountId: '', projectName: 'notion-sync-7ja' },
    },
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
    api: { origin: 'https://partner-portal-api-216566158850.us-central1.run.app', pathPrefix: '/api/partner' },
    endpoints: ['/api/partner/health/comprehensive'],
    deploy: {
      cloudRun: { projectId: '216566158850', location: 'us-central1', serviceName: 'partner-portal-api' },
      cloudflarePages: { accountId: '', projectName: 'dc-partner-portal' },
    },
    details:
      'Partner management platform for vendor onboarding, deal pipeline tracking, ' +
      'job management, and resource library. Integrates with Notion for data sync.',
  },
  {
    id: 'bd-tools',
    slug: 'bd-tools',
    name: 'BD Tools',
    description: 'Internal business development tools',
    frontend: { origin: 'https://bd-tools-5qa.pages.dev' },
    deploy: {
      cloudflarePages: { accountId: '', projectName: 'bd-tools' },
    },
    details: 'Static HTML tools for the business development team. Served behind hub auth.',
  },
];
