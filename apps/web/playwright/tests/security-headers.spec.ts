import { expect, test } from "@playwright/test";

test.describe("security headers", () => {
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
});
