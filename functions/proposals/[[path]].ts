// CF Pages Function: proxy /proposals/* to proposals SPA frontend (dc-dev.pages.dev)
// Strips /proposals prefix. Includes SPA fallback: if upstream 404 + no file extension, serve index.html
const ORIGIN = 'https://dc-dev.pages.dev';

const HAS_EXTENSION = /\.[a-zA-Z0-9]+$/;

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const path = url.pathname.replace(/^\/proposals/, '') || '/';
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

  // SPA fallback: if 404 and path has no file extension, serve index.html
  if (response.status === 404 && !HAS_EXTENSION.test(path)) {
    const fallback = await fetch(`${ORIGIN}/index.html`, {
      headers: { 'Host': new URL(ORIGIN).host },
    });
    return new Response(fallback.body, {
      status: 200,
      headers: fallback.headers,
    });
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
};
