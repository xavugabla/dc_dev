/**
 * Add projects here to show them on the hub.
 * Each project can point to a path (for subdirs) or external URL.
 */
export interface Project {
  id: string;
  name: string;
  description: string;
  href: string;
  /** Optional: external URL vs relative path */
  external?: boolean;
}

export const projects: Project[] = [
  {
    id: 'one-click-dc',
    name: 'DaisyChain',
    description: 'Energy analysis and utility cost modeling',
    href: 'https://dc-dev.pages.dev',
    external: true,
  },
  {
    id: 'pipeline',
    name: 'Pipeline CRM',
    description: 'Notion CRM pipeline analytics',
    href: '/pipeline/',
  },
];
