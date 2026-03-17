// CF Pages Function: proxy /api/proposals/* to one-click-dc-api Cloud Run
// Strips /api/proposals and re-adds /api — one_click_dc routes are /api/graphs, /api/buildings, etc.
import { getIdentityToken } from '../../_lib/gcp-auth';

interface Env {
  GCP_SERVICE_ACCOUNT_KEY: string;
}

const BACKEND = 'https://one-click-dc-api-216566158850.us-central1.run.app';

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  // /api/proposals/health → /health, /api/proposals/graphs → /api/graphs
  const suffix = url.pathname.replace(/^\/api\/proposals/, '') || '/';
  // one_click_dc mounts routers at /api prefix, but /health is at root
  const backendUrl = `${BACKEND}${suffix}${url.search}`;

  const headers = new Headers(context.request.headers);
  headers.set('X-Forwarded-Host', url.host);
  headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));
  headers.delete('host');

  if (context.env.GCP_SERVICE_ACCOUNT_KEY) {
    const idToken = await getIdentityToken(context.env.GCP_SERVICE_ACCOUNT_KEY, BACKEND);
    headers.set('Authorization', `Bearer ${idToken}`);
  }

  const response = await fetch(backendUrl, {
    method: context.request.method,
    headers,
    body: context.request.method !== 'GET' && context.request.method !== 'HEAD'
      ? context.request.body
      : undefined,
    redirect: 'manual',
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete('access-control-allow-origin');
  responseHeaders.delete('access-control-allow-credentials');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
};
