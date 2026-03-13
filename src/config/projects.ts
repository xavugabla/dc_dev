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
  // Example entries – replace with your actual projects
  // { id: 'tools', name: 'Tools', description: 'Dev utilities', href: '/tools/', external: false },
  // { id: 'docs', name: 'Docs', description: 'Documentation', href: 'https://docs.example.com', external: true },
];
