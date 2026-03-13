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
    name: 'One Click DC',
    description: 'Energy calculation and proposal tools',
    href: '/one-click-dc/',
    external: false,
  },
];
