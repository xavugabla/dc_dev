/**
 * Pages Function middleware — runs before every request.
 * Enforces session-based auth for protected routes.
 * Public paths, static assets, and admin paths (key-protected separately) skip auth.
 */

interface Env {
  AUTH: KVNamespace;
  ADMIN_SECRET: string;
  PIPELINE_ORIGIN?: string;
  ONE_CLICK_ORIGIN?: string;
}

const SESSION_COOKIE = "dc_session";

const PUBLIC_PREFIXES = [
  "/login",
  "/api/request-access",
  "/verify",
  "/api/admin",
  "/admin",
];

const ASSET_EXTENSIONS = /\.(css|js|mjs|svg|png|jpg|jpeg|gif|ico|woff2?|ttf|eot|webp|avif|json|xml|txt|webmanifest)$/;

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return false; // homepage is protected
  if (ASSET_EXTENSIONS.test(pathname)) return true;
  if (pathname.startsWith("/_assets/")) return true;
  if (pathname.startsWith("/styles/")) return true;
  if (pathname === "/favicon.svg") return true;
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

async function getSession(
  kv: KVNamespace,
  sessionId: string
): Promise<string | null> {
  const data = await kv.get(`session:${sessionId}`);
  if (!data) return null;
  const { email, expiresAt } = JSON.parse(data);
  if (Date.now() > expiresAt) return null;
  return email;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;

  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const url = new URL(request.url);
  const pathname = url.pathname;

  // Public paths and static assets skip auth
  if (isPublicPath(pathname)) {
    return next();
  }

  // Check session cookie
  const cookie = request.headers.get("Cookie");
  const sessionId = cookie?.match(
    new RegExp(`${SESSION_COOKIE}=([^;]+)`)
  )?.[1];

  if (!sessionId) {
    return Response.redirect(new URL("/login", request.url).toString(), 302);
  }

  const email = await getSession(env.AUTH, sessionId);
  if (!email) {
    return Response.redirect(new URL("/login", request.url).toString(), 302);
  }

  // Authenticated — proxy /pipeline/* to dc_async Cloud Run
  if (pathname.startsWith("/pipeline") && env.PIPELINE_ORIGIN) {
    const targetPath = pathname.replace(/^\/pipeline/, "") || "/";
    const targetUrl = `${env.PIPELINE_ORIGIN}${targetPath}${url.search}`;

    const headers = new Headers(request.headers);
    headers.set("Host", new URL(env.PIPELINE_ORIGIN).host);
    headers.delete("Cookie");

    const res = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.body,
      redirect: "follow",
    });

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    });
  }

  // Pass through to static asset
  return next();
};
