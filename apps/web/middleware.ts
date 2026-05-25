// 05a + 06b: 認証 middleware（edge runtime, 二段防御の第1段）。
// matcher: /admin/:path*, /profile/:path*
//
// /admin 配下:
//   - 未ログイン → /login?gate=admin_required
//   - ログイン済 + isAdmin=false → 403 Forbidden
//   - ログイン済 + isAdmin=true → next()
// /profile 配下（06b 追加）:
//   - 未ログイン → /login?redirect=<元path>
//   - ログイン済 → next()（rules_declined / deleted は API 層で 410 / state 解決）
//
// 不変条件 #5: D1 は触らない（JWT verify のみ）。
// 不変条件 #9: `/no-access` 専用画面に依存せず /login?... に redirect。
// 不変条件 #11: admin / profile 画面 HTML を未認証に SSR させない。
import { NextResponse, type NextRequest } from "next/server";
import { decodeAuthSessionJwt } from "@ubm-hyogo/shared";
import { getPublicEnv } from "@/lib/env";
import {
  applySecurityHeaders,
  buildCspDirective,
  buildSentryCspReportUrl,
  type SecurityHeaderConfig,
} from "@/lib/security-headers";

const SESSION_COOKIE_NAMES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
] as const;

const buildAdminLoginRedirect = (req: NextRequest): NextResponse => {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("gate", "admin_required");
  return NextResponse.redirect(url);
};

const buildProfileLoginRedirect = (req: NextRequest): NextResponse => {
  const original = req.nextUrl.pathname + req.nextUrl.search;
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("redirect", original);
  return NextResponse.redirect(url);
};

const authSecret = (req: NextRequest): string =>
  req.headers.get("x-ubm-auth-secret") ??
  (typeof process === "undefined" ? "" : process.env["AUTH_SECRET"] ?? "");

const sessionToken = (req: NextRequest): string | undefined => {
  for (const name of SESSION_COOKIE_NAMES) {
    const value = req.cookies.get(name)?.value;
    if (value) return value;
  }
  return undefined;
};

const buildSecurityHeaderConfig = (): SecurityHeaderConfig => {
  const env = getPublicEnv();
  const reportEndpoint = buildSentryCspReportUrl(env.NEXT_PUBLIC_SENTRY_DSN);
  const cfg: SecurityHeaderConfig = {
    cspMode: "report-only",
    apiBaseUrl: env.NEXT_PUBLIC_API_BASE_URL,
    authOrigin: "https://accounts.google.com",
  };
  if (reportEndpoint) {
    cfg.reportEndpoint = reportEndpoint;
  }
  return cfg;
};

const generateNonce = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
};

const nextWithRequestHeaders = (requestHeaders: Headers): NextResponse =>
  NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

const guardedMiddleware = async (
  req: NextRequest,
  requestHeaders: Headers,
) => {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/profile")) {
    return nextWithRequestHeaders(requestHeaders);
  }

  const claims = await decodeAuthSessionJwt(authSecret(req), sessionToken(req));

  if (pathname.startsWith("/admin")) {
    if (!claims) {
      return buildAdminLoginRedirect(req);
    }
    if (!claims.isAdmin) {
      return new NextResponse("Forbidden", {
        status: 403,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
    return nextWithRequestHeaders(requestHeaders);
  }
  if (pathname.startsWith("/profile")) {
    if (!claims) {
      return buildProfileLoginRedirect(req);
    }
    return nextWithRequestHeaders(requestHeaders);
  }
  return nextWithRequestHeaders(requestHeaders);
};

export async function middleware(req: NextRequest) {
  const nonce = generateNonce();
  const securityHeaderConfig = {
    ...buildSecurityHeaderConfig(),
    nonce,
  };
  const csp = buildCspDirective(securityHeaderConfig);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = await guardedMiddleware(req, requestHeaders);
  response.headers.set("x-nonce", nonce);
  return applySecurityHeaders(response, securityHeaderConfig);
}

export default middleware;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
  runtime: "experimental-edge",
};
