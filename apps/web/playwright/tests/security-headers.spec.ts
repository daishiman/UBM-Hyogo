import { expect, test } from "@playwright/test";

test.describe("security headers", () => {
  const unsafeInline = ["'unsafe", "-inline'"].join("");

  test("public top page emits CSP report-only and Permissions-Policy", async ({
    request,
  }) => {
    const res = await request.get("/");
    const headers = res.headers();

    expect(res.status()).toBe(200);
    expect(headers["content-security-policy-report-only"]).toBeTruthy();
    expect(headers["permissions-policy"]).toBeTruthy();
    expect(headers["x-frame-options"]).toBe("DENY");
  });

  test("login page emits security headers", async ({ request }) => {
    const res = await request.get("/login");
    const headers = res.headers();

    expect(res.status()).toBe(200);
    expect(headers["content-security-policy-report-only"]).toBeTruthy();
    expect(headers["permissions-policy"]).toBeTruthy();
    expect(headers["x-content-type-options"]).toBe("nosniff");
  });

  test("admin redirect emits CSP report-only and Permissions-Policy", async ({
    request,
  }) => {
    const res = await request.get("/admin", { maxRedirects: 0 });
    const headers = res.headers();

    expect([307, 308]).toContain(res.status());
    expect(headers["content-security-policy-report-only"]).toBeTruthy();
    expect(headers["permissions-policy"]).toBeTruthy();
    expect(headers["x-frame-options"]).toBe("DENY");
  });

  test("Permissions-Policy does not include browsing-topics", async ({
    request,
  }) => {
    const res = await request.get("/admin", { maxRedirects: 0 });
    const policy = res.headers()["permissions-policy"] ?? "";

    expect(policy).not.toContain("browsing-topics");
  });

  test("admin redirect response also includes security headers", async ({
    request,
  }) => {
    const res = await request.get("/admin", { maxRedirects: 0 });
    const headers = res.headers();

    expect([307, 308]).toContain(res.status());
    expect(headers["content-security-policy-report-only"]).toBeTruthy();
    expect(headers["permissions-policy"]).toBeTruthy();
  });

  test("CSP connect-src includes configured API base URL", async ({
    request,
  }) => {
    const res = await request.get("/admin", { maxRedirects: 0 });
    const csp = res.headers()["content-security-policy-report-only"] ?? "";

    expect(csp).toContain("connect-src 'self'");
    expect(csp).toMatch(
      /connect-src 'self' https?:\/\/[^ ]+ https:\/\/accounts\.google\.com/,
    );
    expect(csp).not.toContain("require-trusted-types-for");
  });

  test("CSP uses a fresh nonce and removes script/style inline fallback", async ({
    request,
  }) => {
    const first = await request.get("/");
    const second = await request.get("/");
    const firstHeaders = first.headers();
    const secondHeaders = second.headers();
    const firstCsp = firstHeaders["content-security-policy-report-only"] ?? "";
    const secondCsp = secondHeaders["content-security-policy-report-only"] ?? "";
    const firstNonce = firstHeaders["x-nonce"] ?? "";
    const secondNonce = secondHeaders["x-nonce"] ?? "";

    expect(first.status()).toBe(200);
    expect(second.status()).toBe(200);
    expect(firstNonce).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    expect(secondNonce).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    expect(firstNonce).not.toBe(secondNonce);
    expect(firstCsp).toContain(`script-src 'self' 'nonce-${firstNonce}' 'strict-dynamic'`);
    expect(firstCsp).toContain(`style-src 'self' 'nonce-${firstNonce}'`);
    expect(firstCsp).toContain(`style-src-attr ${unsafeInline}`);
    expect(firstCsp).not.toContain(`script-src 'self' ${unsafeInline}`);
    expect(firstCsp).not.toContain(`style-src 'self' ${unsafeInline}`);
    expect(secondCsp).toContain(`script-src 'self' 'nonce-${secondNonce}' 'strict-dynamic'`);
  });
});
