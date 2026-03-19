// CF Pages Function: proxy /bd-tools/* to bd-tools.pages.dev
// Strips /bd-tools prefix. Static site — no SPA fallback needed.
const ORIGIN = 'https://dc-bd-tools.pages.dev';

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const path = url.pathname.replace(/^\/bd-tools/, '') || '/';
  const targetUrl = `${ORIGIN}${path}${url.search}`;

  const headers = new Headers(context.request.headers);
  headers.set('Host', new URL(ORIGIN).host);
  headers.delete('cookie');

  const response = await fetch(targetUrl, {
    method: context.request.method,
    headers,
    body: context.request.method !== 'GET' && context.request.method !== 'HEAD'
      ? context.request.body
      : undefined,
    redirect: 'manual',
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
};
