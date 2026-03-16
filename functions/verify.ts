/**
 * GET /api/verify?token=xxx
 * Validates a magic link token, creates a session, sets cookie, redirects to /.
 * Uses a static route with query param to avoid dynamic path routing issues.
 */

interface Env {
  AUTH: KVNamespace;
}

const SESSION_COOKIE = "dc_session";
const SESSION_TTL = 60 * 60 * 24 * 30; // 30 days

async function createSession(kv: KVNamespace, email: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  await kv.put(
    `session:${sessionId}`,
    JSON.stringify({ email, expiresAt: Date.now() + SESSION_TTL * 1000 }),
    { expirationTtl: SESSION_TTL }
  );
  return sessionId;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response("Invalid link — missing token", { status: 400 });
  }

  const data = await env.AUTH.get(`token:${token}`);
  if (!data) {
    return Response.redirect(
      new URL("/login?error=expired", request.url).toString(),
      302
    );
  }

  const { email, expiresAt } = JSON.parse(data);
  if (Date.now() > expiresAt) {
    await env.AUTH.delete(`token:${token}`);
    return Response.redirect(
      new URL("/login?error=expired", request.url).toString(),
      302
    );
  }

  // Consume token (single-use)
  await env.AUTH.delete(`token:${token}`);
  const sessionId = await createSession(env.AUTH, email);

  const redirectUrl = new URL("/", request.url).toString();
  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectUrl,
      "Set-Cookie": `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL}`,
    },
  });
};
