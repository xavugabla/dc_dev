// CF Pages Function: proxy /api/crm/* to dc-async-api Cloud Run
// Strips /api/crm prefix — dc_async routes are /health, /scripts/*, etc.
const BACKEND = 'https://dc-async-api-216566158850.us-central1.run.app';

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  // /api/crm/health → /health, /api/crm/scripts/foo → /scripts/foo
  const path = url.pathname.replace(/^\/api\/crm/, '') || '/';
  const backendUrl = `${BACKEND}${path}${url.search}`;

  const headers = new Headers(context.request.headers);
  headers.set('X-Forwarded-Host', url.host);
  headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));
  headers.delete('host');

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
