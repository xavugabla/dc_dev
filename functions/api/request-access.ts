/**
 * POST /api/request-access
 * Stores a pending access request in KV (7-day TTL).
 */

interface Env {
  AUTH: KVNamespace;
}

function corsHeaders(res: Response): Response {
  const r = new Response(res.body, res);
  r.headers.set("Access-Control-Allow-Origin", "*");
  r.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  r.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return r;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const ct = request.headers.get("Content-Type") || "";
  let email: string;
  let message: string;

  if (ct.includes("application/json")) {
    const body = (await request.json()) as { email?: string; message?: string };
    email = String(body.email || "").trim().toLowerCase();
    message = String(body.message || "").trim();
  } else {
    const form = await request.formData();
    email = String(form.get("email") || "").trim().toLowerCase();
    message = String(form.get("message") || "").trim();
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return corsHeaders(
      Response.json({ error: "Invalid email" }, { status: 400 })
    );
  }

  const existing = await env.AUTH.get(`approved:${email}`);
  if (existing) {
    return corsHeaders(
      Response.json(
        { error: "Already approved. Use your magic link to sign in." },
        { status: 400 }
      )
    );
  }

  await env.AUTH.put(
    `pending:${email}`,
    JSON.stringify({ email, message, createdAt: Date.now() }),
    { expirationTtl: 60 * 60 * 24 * 7 } // 7 days
  );

  return corsHeaders(
    Response.json({
      ok: true,
      message: "Request submitted. You'll receive access when approved.",
    })
  );
};
