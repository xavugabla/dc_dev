/**
 * Lightweight middleware — checks for session cookie on protected routes.
 * No KV, no env vars. Backend enforces real session validity on API calls.
 * This just prevents unauthenticated users from seeing protected pages.
 */

const SESSION_COOKIE = "dc_session";

const PUBLIC_PREFIXES = ["/login", "/api", "/admin"];

const ASSET_RE =
  /\.(css|js|mjs|svg|png|jpg|jpeg|gif|ico|woff2?|ttf|eot|webp|avif|json|xml|txt|webmanifest)$/;

function isPublicPath(pathname: string): boolean {
  if (ASSET_RE.test(pathname)) return true;
  if (pathname.startsWith("/_assets/") || pathname.startsWith("/styles/")) return true;
  if (pathname === "/favicon.svg") return true;
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export const onRequest: PagesFunction = async ({ request, next }) => {
  if (request.method === "OPTIONS") return next();

  const url = new URL(request.url);

  // Public paths and assets skip auth
  if (isPublicPath(url.pathname)) return next();

  // Check for session cookie (presence only — backend validates on API calls)
  const cookie = request.headers.get("Cookie");
  const hasSession = cookie
    ?.split(";")
    .some((c) => c.trim().startsWith(`${SESSION_COOKIE}=`));

  if (!hasSession) {
    return Response.redirect(new URL("/login", request.url).toString(), 302);
  }

  return next();
};
