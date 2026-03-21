// CF Pages Function: proxy /portal/* to partner portal SPA frontend
// Strips /portal prefix. Includes SPA fallback for client-side routing.
import { injectHomeButton } from '../_lib/home-button';

interface Env {
  PORTAL_FRONTEND_ORIGIN: string;
}

const DEFAULT_ORIGIN = 'https://dc-portal.pages.dev';

const HAS_EXTENSION = /\.[a-zA-Z0-9]+$/;

export const onRequest: PagesFunction<Env> = async (context) => {
  const ORIGIN = context.env.PORTAL_FRONTEND_ORIGIN || DEFAULT_ORIGIN;
  const url = new URL(context.request.url);
  const path = url.pathname.replace(/^\/portal/, '') || '/';
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
    redirect: 'follow',
  });

  // SPA fallback: if 404 and path has no file extension, serve index.html
  if (response.status === 404 && !HAS_EXTENSION.test(path)) {
    const fallback = await fetch(`${ORIGIN}/index.html`, {
      headers: { 'Host': new URL(ORIGIN).host },
    });
    const res = new Response(fallback.body, {
      status: 200,
      headers: fallback.headers,
    });
    return injectHomeButton(res);
  }

  const res = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
  return injectHomeButton(res);
};
