/**
 * Single source of truth for onboarded projects.
 * Drives both the UI (projects list) and routing configuration.
 *
 * HOW TO ADD A NEW PROJECT
 * ────────────────────────
 * 1. Add an entry to the `projectConfigs` array.
 * 2. Create functions/{slug}/[[path]].ts (frontend proxy) — import injectHomeButton.
 * 3. If the project has an API: functions/api/{slug}/[[path]].ts.
 * 4. Add deploy config entry in backend/hub_api/routes/deployments.py DEPLOY_CONFIG.
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

/** Platform (Hub) deploy metadata — Hub API + dc-hub Pages */
export const platformDeployConfig: DeployConfig = {
  cloudRun: { projectId: '216566158850', location: 'us-central1', serviceName: 'dc-hub-api' },
  cloudflarePages: { accountId: '', projectName: 'dc-hub' },
};

export const projectConfigs: ProjectConfig[] = [
  {
    id: 'engine',
    slug: 'engine',
    name: 'Engine',
    description: 'Energy analysis and utility cost modeling',
    frontend: { origin: 'https://dc-engine.pages.dev' },
    api: { origin: 'https://dc-engine-api-bz6s4nkt4q-uc.a.run.app', pathPrefix: '/api/engine' },
    endpoints: ['/api/engine/health/detailed'],
    deploy: {
      cloudRun: { projectId: '216566158850', location: 'us-central1', serviceName: 'dc-engine-api' },
      cloudflarePages: { accountId: '', projectName: 'dc-engine' },
    },
    details:
      'Full-stack energy platform (React + FastAPI) for building-level utility analysis. ' +
      'Includes calculation graph engine, proposal generation, rate sensitivity modeling, ' +
      'and submeter analytics. Deployed on Cloudflare Pages with a Neon Postgres backend.',
  },
  {
    id: 'notion-sync',
    slug: 'notion-sync',
    name: 'Notion Sync',
    description: 'Notion sync and pipeline analytics',
    frontend: { origin: 'https://dc-notion-sync.pages.dev' },
    api: { origin: 'https://dc-notion-sync-api-bz6s4nkt4q-uc.a.run.app', pathPrefix: '/api/notion-sync' },
    endpoints: ['/api/notion-sync/health'],
    deploy: {
      cloudRun: { projectId: '216566158850', location: 'us-central1', serviceName: 'dc-notion-sync-api' },
      cloudflarePages: { accountId: '', projectName: 'dc-notion-sync' },
    },
    details:
      'Lightweight analytics layer on top of Notion databases. ' +
      'Syncs deal pipeline data via the Notion API and exposes summary endpoints ' +
      'for revenue forecasting and stage-conversion metrics.',
  },
  {
    id: 'portal',
    slug: 'portal',
    name: 'Portal',
    description: 'Vendor and channel partner management',
    frontend: { origin: 'https://dc-portal.pages.dev' },
    api: { origin: 'https://dc-portal-api-bz6s4nkt4q-uc.a.run.app', pathPrefix: '/api/portal' },
    endpoints: ['/api/portal/health/comprehensive'],
    deploy: {
      cloudRun: { projectId: '216566158850', location: 'us-central1', serviceName: 'dc-portal-api' },
      cloudflarePages: { accountId: '', projectName: 'dc-portal' },
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
    frontend: { origin: 'https://dc-bd-tools.pages.dev' },
    deploy: {
      cloudflarePages: { accountId: '', projectName: 'dc-bd-tools' },
    },
    details: 'Static HTML tools for the business development team. Served behind hub auth.',
  },
];
