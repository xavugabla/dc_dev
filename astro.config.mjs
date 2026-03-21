import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  build: {
    assets: '_assets',
  },
  vite: {
    server: {
      proxy: {
        // API proxies (order matters: more specific prefixes first)
        '/api/engine': {
          target: 'http://localhost:8001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/engine/, ''),
        },
        '/api/notion-sync': {
          target: 'http://localhost:8002',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/notion-sync/, ''),
        },
        '/api': {
          target: 'http://localhost:8003',
          changeOrigin: true,
        },
        // Frontend proxies
        '/engine': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/engine/, ''),
          ws: true,
        },
        '/portal': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/portal/, ''),
          ws: true,
        },
        '/notion-sync': {
          target: 'http://localhost:8002',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/notion-sync/, ''),
          ws: true,
        },
      },
    },
  },
});
