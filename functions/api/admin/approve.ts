/**
 * POST /api/admin/approve
 * Approves a pending request, generates a magic link token.
 * Admin key required in ?key=, Authorization header, or JSON body.
 */

interface Env {
  AUTH: KVNamespace;
  ADMIN_SECRET: string;
}

const TOKEN_TTL = 60 * 60 * 24; // 24 hours

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

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);

  // Check admin key from URL, header, or body
  let key = getAdminKey(url, request);
  const ct = request.headers.get("Content-Type") || "";
  let email = "";

  if (ct.includes("application/json")) {
    const body = (await request.json()) as {
      email?: string;
      key?: string;
    };
    email = String(body.email || "").trim().toLowerCase();
    if (!key && body.key) key = body.key;
  } else {
    const form = await request.formData();
    email = String(form.get("email") || "").trim().toLowerCase();
    if (!key) key = form.get("key") as string | null;
  }

  if (key !== env.ADMIN_SECRET) {
    return corsHeaders(new Response("Unauthorized", { status: 401 }));
  }

  if (!email) {
    return corsHeaders(
      Response.json({ error: "Email required" }, { status: 400 })
    );
  }

  // Remove pending, mark approved
  await env.AUTH.delete(`pending:${email}`);
  await env.AUTH.put(`approved:${email}`, String(Date.now()), {
    expirationTtl: 60 * 60 * 24 * 365, // 1 year
  });

  // Generate magic link token
  const token = crypto.randomUUID().replace(/-/g, "");
  await env.AUTH.put(
    `token:${token}`,
    JSON.stringify({ email, expiresAt: Date.now() + TOKEN_TTL * 1000 }),
    { expirationTtl: TOKEN_TTL }
  );

  const origin = new URL(request.url).origin;
  const magicLink = `${origin}/verify?token=${token}`;

  return corsHeaders(Response.json({ ok: true, magicLink, email }));
};
