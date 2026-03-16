// CF Pages Function: proxy /api/* to Cloud Run
// Exact same pattern as one_click_dc/functions/api/[[path]].ts
const BACKEND = 'https://dc-dev-hub-api-216566158850.us-central1.run.app';

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const backendUrl = `${BACKEND}${url.pathname}${url.search}`;

  const headers = new Headers(context.request.headers);
  // Tell the backend the original host so it can generate correct URLs (e.g. magic links)
  headers.set('X-Forwarded-Host', url.host);
  headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));
  headers.delete('host');

  const response = await fetch(backendUrl, {
    method: context.request.method,
    headers,
    body: context.request.method !== 'GET' && context.request.method !== 'HEAD'
      ? context.request.body
      : undefined,
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
