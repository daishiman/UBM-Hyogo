import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { signSessionJwt, asMemberId } from "@ubm-hyogo/shared";

vi.mock("@/lib/env", () => ({
  getSecurityHeaderEnv: () => ({
    cspMode: "report-only" as const,
    apiBaseUrl: "http://localhost:8787",
  }),
  getPublicEnv: () => ({
    ENVIRONMENT: "local" as const,
    NEXT_PUBLIC_API_BASE_URL: "http://localhost:8787",
    NEXT_PUBLIC_SENTRY_DSN: undefined,
  }),
}));

const { middleware, config: middlewareConfig } = await import("../middleware");

const TEST_SECRET = "test-secret-for-proxy-spec";

const makeCookie = async (isAdmin: boolean) => {
  const token = await signSessionJwt(TEST_SECRET, {
    memberId: asMemberId(isAdmin ? "member_admin" : "member_regular"),
    email: isAdmin ? "admin@example.com" : "member@example.com",
    name: isAdmin ? "Admin User" : "Regular User",
    isAdmin,
  });
  return `authjs.session-token=${token}`;
};

const makeRequest = (path: string, opts?: { cookie?: string }) => {
  const url = new URL(`http://localhost:3000${path}`);
  const headers = new Headers();
  headers.set("x-ubm-auth-secret", TEST_SECRET);
  if (opts?.cookie) headers.append("cookie", opts.cookie);
  return new NextRequest(url, { headers });
};

describe("middleware", () => {
  it("matcher 設定が security headers 適用のため全ルートを対象とする（静的アセット除外）", () => {
    expect(middlewareConfig.matcher).toEqual([
      "/((?!_next/static|_next/image|favicon.ico).*)",
    ]);
  });

  it("未ログインで /admin にアクセスすると /login?gate=admin_required へ redirect する", async () => {
    const res = await middleware(makeRequest("/admin/dashboard"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
    expect(res.headers.get("location")).toContain("gate=admin_required");
  });

  it("未ログインで /profile にアクセスすると /login?redirect=%2Fprofile へ redirect する", async () => {
    const res = await middleware(makeRequest("/profile"));
    expect(res.headers.get("location")).toContain("/login");
    expect(res.headers.get("location")).toContain("redirect=%2Fprofile");
  });

  it("未ログインで /profile/edit?tab=tags にアクセスすると元 path+search を redirect param に保持する", async () => {
    const res = await middleware(makeRequest("/profile/edit?tab=tags"));
    const loc = res.headers.get("location") ?? "";
    expect(loc).toMatch(/redirect=%2Fprofile%2Fedit%3Ftab%3Dtags/);
  });

  it("認証済 non-admin で /admin にアクセスすると /login?gate=forbidden へ redirect する", async () => {
    const res = await middleware(makeRequest("/admin", { cookie: await makeCookie(false) }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
    expect(res.headers.get("location")).toContain("gate=forbidden");
  });

  it("認証済 admin で /admin にアクセスすると NextResponse.next() 相当を返す", async () => {
    const res = await middleware(makeRequest("/admin", { cookie: await makeCookie(true) }));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("認証済で /profile にアクセスすると NextResponse.next() 相当を返す", async () => {
    const res = await middleware(makeRequest("/profile", { cookie: await makeCookie(false) }));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("NextResponse.next 経路の request header に x-pathname を注入する", async () => {
    const res = await middleware(makeRequest("/members?tag=active"));
    expect(res.headers.get("x-middleware-next")).toBe("1");
    expect(res.headers.get("x-middleware-request-x-pathname")).toBe("/members");
  });

  it("全レスポンスに request ごとの nonce CSP を付与する", async () => {
    const first = await middleware(makeRequest("/"));
    const second = await middleware(makeRequest("/"));
    const firstCsp = first.headers.get("Content-Security-Policy-Report-Only") ?? "";
    const secondCsp = second.headers.get("Content-Security-Policy-Report-Only") ?? "";
    const firstNonce = first.headers.get("x-nonce") ?? "";
    const secondNonce = second.headers.get("x-nonce") ?? "";
    expect(firstNonce).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    expect(secondNonce).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    expect(firstNonce).not.toBe(secondNonce);
    expect(firstCsp).toContain(`script-src 'self' 'nonce-${firstNonce}' 'strict-dynamic'`);
    expect(firstCsp).toContain(`style-src 'self' 'nonce-${firstNonce}'`);
    expect(firstCsp).not.toContain("style-src-attr");
    expect(firstCsp).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(firstCsp).not.toContain("style-src 'self' 'unsafe-inline'");
    expect(secondCsp).toContain(`script-src 'self' 'nonce-${secondNonce}' 'strict-dynamic'`);
  });
});
