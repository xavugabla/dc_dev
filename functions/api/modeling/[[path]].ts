// CF Pages Function: proxy /api/modeling/* to one-click-dc-api Cloud Run
// Strips /api/modeling prefix — one_click_dc routes are /health, /api/graphs, etc.
import { getIdentityToken } from '../../_lib/gcp-auth';

interface Env {
  GCP_SERVICE_ACCOUNT_KEY: string;
}

const BACKEND = 'https://one-click-dc-api-216566158850.us-central1.run.app';

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  // /api/modeling/health → /health, /api/modeling/graphs → /api/graphs
  const suffix = url.pathname.replace(/^\/api\/modeling/, '') || '/';
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
