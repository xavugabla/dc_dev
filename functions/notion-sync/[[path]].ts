// CF Pages Function: proxy /notion-sync/* to Notion Sync frontend (dc-notion-sync.pages.dev)
// Strips /notion-sync prefix and forwards remainder to origin
import { injectHomeButton } from '../_lib/home-button';

const ORIGIN = 'https://dc-notion-sync.pages.dev';

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const path = url.pathname.replace(/^\/notion-sync/, '') || '/';
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

  const res = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
  return injectHomeButton(res);
};
