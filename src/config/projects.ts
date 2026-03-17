/**
 * Add projects here to show them on the hub.
 * Each project can point to a path (for subdirs) or external URL.
 *
 * HOW TO ADD A NEW PROJECT
 * ────────────────────────
 * 1. Add an entry to the `projects` array below.
 * 2. Fill in all required fields: id, name, description, href.
 * 3. Optional fields:
 *    - external: true   → opens in a new tab
 *    - statusUrl         → URL to ping for health checks (falls back to href)
 *    - details           → longer explanation shown in the expandable section
 * 4. The project will appear on both the home page (first 3) and /projects/.
 */
export interface Project {
  id: string;
  name: string;
  description: string;
  href: string;
  /** true → opens in a new tab */
  external?: boolean;
  /** URL to ping for health status. Defaults to href if omitted. */
  statusUrl?: string;
  /** Longer description shown in the collapsible details section. */
  details?: string;
}

export const projects: Project[] = [
  {
    id: 'one-click-dc',
    name: 'DaisyChain',
    description: 'Energy analysis and utility cost modeling',
    href: '/proposals/',
    statusUrl: '/api/proposals/health',
    details:
      'Full-stack energy platform (React + Hono) for building-level utility analysis. ' +
      'Includes calculation graph engine, proposal generation, rate sensitivity modeling, ' +
      'and submeter analytics. Deployed on Cloudflare Pages with a Neon Postgres backend.',
  },
  {
    id: 'pipeline',
    name: 'Pipeline CRM',
    description: 'Notion CRM pipeline analytics',
    href: '/crm/',
    statusUrl: '/api/crm/health',
    details:
      'Lightweight analytics layer on top of Notion databases. ' +
      'Syncs deal pipeline data via the Notion API and exposes summary endpoints ' +
      'for revenue forecasting and stage-conversion metrics.',
  },
  {
    id: 'partner-portal',
    name: 'Partner Portal',
    description: 'Vendor and channel partner management',
    href: '/partner-portal/',
    statusUrl: '/api/partner/health',
    details:
      'Partner management platform for vendor onboarding, deal pipeline tracking, ' +
      'job management, and resource library. Integrates with Notion for data sync.',
  },
];
