/**
 * Project list for the hub UI.
 * Sourced from projects.config.ts for consistency.
 */
import { projectConfigs } from './projects.config';

export interface Project {
  id: string;
  name: string;
  description: string;
  href: string;
  external?: boolean;
  statusUrl?: string;
  details?: string;
}

export const projects: Project[] = projectConfigs.map((p) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  href: `/${p.slug}/`,
  statusUrl: p.api ? `${p.api.pathPrefix}/health` : undefined,
  external: p.external,
  details: p.details,
}));
