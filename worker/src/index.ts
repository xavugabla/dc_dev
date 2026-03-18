import { getIdentityToken } from '../../functions/_lib/gcp-auth';

export interface Env {
  AUTH: KVNamespace;
  ADMIN_SECRET: string;
  HUB_ORIGIN: string;
  MODELING_ORIGIN?: string;         // DaisyChain frontend (dc-modeling.pages.dev)
  MODELING_API_ORIGIN?: string;    // one-click-dc-api Cloud Run
  NOTION_SYNC_ORIGIN?: string;     // Notion Sync frontend (notion-sync-7ja.pages.dev)
  NOTION_SYNC_API_ORIGIN?: string; // dc-async-api Cloud Run
  PIPELINE_ORIGIN?: string;
  PARTNER_PORTAL_ORIGIN?: string;
  PARTNER_API_ORIGIN?: string;
  BD_TOOLS_ORIGIN?: string;        // bd-tools CF Pages (bd-tools-5qa.pages.dev)
  GCP_SERVICE_ACCOUNT_KEY?: string;
}

const SESSION_COOKIE = "dc_session";
const SESSION_TTL = 60 * 60 * 24 * 30; // 30 days
const TOKEN_TTL = 60 * 60 * 24; // 24 hours
const PUBLIC_PATHS = ["/login", "/api/request-access", "/api/auth"];
const ADMIN_PATH = "/admin";
const ADMIN_API = "/api/admin";

// dc_dev admin emails — these get X-DC-Admin: true when proxied to partner services
const DC_ADMIN_EMAILS = new Set([
  "masterxavuga@gmail.com",
  // Add other admin emails here
]);

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith(ADMIN_API)
  );
}

function isAdminPath(pathname: string): boolean {
  return pathname === ADMIN_PATH || pathname.startsWith(ADMIN_PATH + "/");
}

function getAdminKey(url: URL, request: Request): string | null {
  const fromUrl = url.searchParams.get("key");
  if (fromUrl) return fromUrl;
  const auth = request.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

async function getAdminKeyFromBody(request: Request, pathname: string): Promise<string | null> {
  if (request.method !== "POST" || !pathname.includes("approve")) return null;
  const ct = request.headers.get("Content-Type") || "";
  if (!ct.includes("application/json")) return null;
  try {
    const body = (await request.clone().json()) as { key?: string };
    return body.key || null;
  } catch {
    return null;
  }
}

async function getSession(env: Env, sessionId: string): Promise<string | null> {
  const data = await env.AUTH.get(`session:${sessionId}`);
  if (!data) return null;
  const { email, expiresAt } = JSON.parse(data);
  if (Date.now() > expiresAt) return null;
  return email;
}

async function createSession(env: Env, email: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  await env.AUTH.put(`session:${sessionId}`, JSON.stringify({
    email,
    expiresAt: Date.now() + SESSION_TTL * 1000,
  }), { expirationTtl: SESSION_TTL });
  return sessionId;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (request.method === "OPTIONS") return corsResponse(new Response(null, { status: 204 }));

    // Magic link login: /api/auth/:token
    if (pathname.startsWith("/api/auth/")) {
      const token = pathname.slice("/api/auth/".length);
      if (!token) return new Response("Invalid link", { status: 400 });
      const data = await env.AUTH.get(`token:${token}`);
      if (!data) return redirect("/login?error=expired");
      const { email, expiresAt } = JSON.parse(data);
      if (Date.now() > expiresAt) {
        await env.AUTH.delete(`token:${token}`);
        return redirect("/login?error=expired");
      }
      await env.AUTH.delete(`token:${token}`);
      const sessionId = await createSession(env, email);
      const res = redirect("/");
      res.headers.set("Set-Cookie", `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL}`);
      return res;
    }

    // Admin API: /api/admin/* (requires key in ?key=, Authorization: Bearer, or JSON body for approve)
    if (pathname.startsWith(ADMIN_API)) {
      let key = getAdminKey(url, request);
      if (!key && request.method === "POST" && pathname.includes("approve")) {
        key = await getAdminKeyFromBody(request, pathname);
      }
      if (key !== env.ADMIN_SECRET) return corsResponse(new Response("Unauthorized", { status: 401 }));
      const res = await handleAdmin(request, env, pathname);
      return corsResponse(res);
    }

    // Admin page: /admin (requires ?key=, then proxy to hub)
    if (isAdminPath(pathname)) {
      const key = url.searchParams.get("key");
      if (key !== env.ADMIN_SECRET) return new Response("Unauthorized", { status: 401 });
      return proxyToOrigin(request, env, pathname, null);
    }

    // API: request access
    if (pathname === "/api/request-access" && request.method === "POST") {
      const res = await handleRequestAccess(request, env);
      return corsResponse(res);
    }

    // Auth check for protected routes
    let email: string | null = null;
    if (!isPublicPath(pathname)) {
      const cookie = request.headers.get("Cookie");
      const sessionId = cookie?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1];
      if (!sessionId) return redirect("/login");
      email = await getSession(env, sessionId);
      if (!email) return redirect("/login");
    }

    // Route to origin
    return proxyToOrigin(request, env, pathname, email);
  },
};

function redirect(location: string): Response {
  return new Response(null, { status: 302, headers: { Location: location } });
}

function corsResponse(res: Response): Response {
  const newRes = new Response(res.body, { status: res.status, statusText: res.statusText, headers: res.headers });
  newRes.headers.set("Access-Control-Allow-Origin", "*");
  newRes.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  newRes.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return newRes;
}

async function handleRequestAccess(request: Request, env: Env): Promise<Response> {
  const ct = request.headers.get("Content-Type") || "";
  let email: string, message: string;
  if (ct.includes("application/json")) {
    const body = await request.json() as Record<string, unknown>;
    email = String(body.email || "").trim().toLowerCase();
    message = String(body.message || "").trim();
  } else {
    const form = await request.formData();
    email = String(form.get("email") || "").trim().toLowerCase();
    message = String(form.get("message") || "").trim();
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }
  const existing = await env.AUTH.get(`approved:${email}`);
  if (existing) {
    return Response.json({ error: "Already approved. Use your magic link to sign in." }, { status: 400 });
  }
  await env.AUTH.put(`pending:${email}`, JSON.stringify({
    email,
    message,
    createdAt: Date.now(),
  }), { expirationTtl: 60 * 60 * 24 * 7 }); // 7 days
  return Response.json({ ok: true, message: "Request submitted. You'll receive access when approved." });
}

async function handleAdmin(request: Request, env: Env, pathname: string): Promise<Response> {
  if (pathname === `${ADMIN_API}/pending` && request.method === "GET") {
    const list = await env.AUTH.list({ prefix: "pending:" });
    const pending: { email: string; message?: string; createdAt: number }[] = [];
    for (const key of list.keys) {
      const data = await env.AUTH.get(key.name);
      if (data) pending.push(JSON.parse(data));
    }
    pending.sort((a, b) => a.createdAt - b.createdAt);
    return Response.json({ pending });
  }
  if (pathname === `${ADMIN_API}/approve` && request.method === "POST") {
    const ct = request.headers.get("Content-Type") || "";
    let email: string;
    if (ct.includes("application/json")) {
      const body = await request.json() as Record<string, unknown>;
      email = String(body.email || "").trim().toLowerCase();
    } else {
      const form = await request.formData();
      email = String(form.get("email") || "").trim().toLowerCase();
    }
    if (!email) return Response.json({ error: "Email required" }, { status: 400 });
    await env.AUTH.delete(`pending:${email}`);
    await env.AUTH.put(`approved:${email}`, String(Date.now()), { expirationTtl: 60 * 60 * 24 * 365 }); // 1 year
    const token = crypto.randomUUID().replace(/-/g, "");
    await env.AUTH.put(`token:${token}`, JSON.stringify({
      email,
      expiresAt: Date.now() + TOKEN_TTL * 1000,
    }), { expirationTtl: TOKEN_TTL });
    const origin = new URL(request.url).origin;
    const magicLink = `${origin}/api/auth/${token}`;
    return Response.json({ ok: true, magicLink, email });
  }
  return new Response("Not found", { status: 404 });
}

async function proxyToOrigin(request: Request, env: Env, pathname: string, email: string | null): Promise<Response> {
  const modelingOrigin = env.MODELING_ORIGIN;
  const modelingApiOrigin = env.MODELING_API_ORIGIN;
  const notionSyncOrigin = env.NOTION_SYNC_ORIGIN;
  const notionSyncApiOrigin = env.NOTION_SYNC_API_ORIGIN;
  const pipelineOrigin = env.PIPELINE_ORIGIN;
  const partnerPortalOrigin = env.PARTNER_PORTAL_ORIGIN;
  const partnerApiOrigin = env.PARTNER_API_ORIGIN;
  const bdToolsOrigin = env.BD_TOOLS_ORIGIN;

  const isModelingApi = modelingApiOrigin && pathname.startsWith("/api/modeling");
  const isNotionSyncApi = notionSyncApiOrigin && pathname.startsWith("/api/notion-sync");
  const isPartnerApi = partnerApiOrigin && pathname.startsWith("/api/partner");
  const isModeling = modelingOrigin && pathname.startsWith("/modeling");
  const isNotionSync = notionSyncOrigin && pathname.startsWith("/notion-sync");
  const isPartnerPortal = partnerPortalOrigin && pathname.startsWith("/partner-portal");
  const isPipeline = pipelineOrigin && pathname.startsWith("/pipeline");
  const isBdTools = bdToolsOrigin && pathname.startsWith("/bd-tools");

  let origin: string;
  let targetPath: string;

  if (isPartnerApi) {
    origin = partnerApiOrigin;
    const suffix = pathname.slice("/api/partner".length);
    // Health routes are at root level (no /api prefix) on the partner backend
    targetPath = suffix.startsWith("/health") ? suffix : "/api" + suffix;
  } else if (isModelingApi) {
    origin = modelingApiOrigin;
    targetPath = pathname.replace(/^\/api\/modeling/, "") || "/";
  } else if (isNotionSyncApi) {
    origin = notionSyncApiOrigin;
    targetPath = pathname.replace(/^\/api\/notion-sync/, "") || "/";
  } else if (isPartnerPortal) {
    origin = partnerPortalOrigin;
    targetPath = pathname;
  } else if (isModeling) {
    origin = modelingOrigin;
    targetPath = pathname.replace(/^\/modeling/, "") || "/";
  } else if (isNotionSync) {
    origin = notionSyncOrigin;
    targetPath = pathname.replace(/^\/notion-sync/, "") || "/";
  } else if (isPipeline) {
    origin = pipelineOrigin;
    targetPath = pathname.slice("/pipeline".length) || "/";
  } else if (isBdTools) {
    origin = bdToolsOrigin;
    targetPath = pathname.replace(/^\/bd-tools/, "") || "/";
  } else {
    origin = env.HUB_ORIGIN;
    targetPath = pathname;
  }

  const targetUrl = `${origin}${targetPath}${new URL(request.url).search}`;
  const headers = new Headers(request.headers);
  headers.set("Host", new URL(origin).host);

  if ((isPartnerApi || isPartnerPortal) && email) {
    headers.set("X-DC-User-Email", email);
    headers.set("X-DC-Admin", DC_ADMIN_EMAILS.has(email) ? "true" : "false");
  }

  const needsGcpAuth =
    env.GCP_SERVICE_ACCOUNT_KEY &&
    (isPartnerApi || isModelingApi || isNotionSyncApi || isPipeline);
  if (needsGcpAuth) {
    const idToken = await getIdentityToken(env.GCP_SERVICE_ACCOUNT_KEY, origin);
    headers.set("Authorization", `Bearer ${idToken}`);
  }

  const res = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: request.body,
    redirect: "follow",
  });
  const newRes = new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
  return newRes;
}
