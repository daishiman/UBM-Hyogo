import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { signSessionJwt, asMemberId } from "@ubm-hyogo/shared";
import { middleware, config as middlewareConfig } from "../middleware";

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
  it("matcher 設定が /admin/:path* と /profile/:path* に限定されている", () => {
    expect(middlewareConfig.matcher).toEqual(["/admin/:path*", "/profile/:path*"]);
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

  it("認証済 non-admin で /admin にアクセスすると 403 Forbidden を返す", async () => {
    const res = await middleware(makeRequest("/admin", { cookie: await makeCookie(false) }));
    expect(res.status).toBe(403);
    await expect(res.text()).resolves.toBe("Forbidden");
  });

  it("認証済 admin で /admin にアクセスすると NextResponse.next() 相当を返す", async () => {
    const res = await middleware(makeRequest("/admin", { cookie: await makeCookie(true) }));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("認証済で /profile にアクセスすると NextResponse.next() 相当を返す", async () => {
    const res = await middleware(makeRequest("/profile", { cookie: await makeCookie(false) }));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });
});
