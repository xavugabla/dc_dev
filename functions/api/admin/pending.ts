/**
 * GET /api/admin/pending?key=ADMIN_SECRET
 * Lists all pending access requests from KV.
 */

interface Env {
  AUTH: KVNamespace;
  ADMIN_SECRET: string;
}

function corsHeaders(res: Response): Response {
  const r = new Response(res.body, res);
  r.headers.set("Access-Control-Allow-Origin", "*");
  r.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  r.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return r;
}

function getAdminKey(url: URL, request: Request): string | null {
  const fromUrl = url.searchParams.get("key");
  if (fromUrl) return fromUrl;
  const auth = request.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const key = getAdminKey(url, request);

  if (key !== env.ADMIN_SECRET) {
    return corsHeaders(new Response("Unauthorized", { status: 401 }));
  }

  const list = await env.AUTH.list({ prefix: "pending:" });
  const pending: { email: string; message?: string; createdAt: number }[] = [];

  for (const k of list.keys) {
    const data = await env.AUTH.get(k.name);
    if (data) pending.push(JSON.parse(data));
  }

  pending.sort((a, b) => a.createdAt - b.createdAt);
  return corsHeaders(Response.json({ pending }));
};
