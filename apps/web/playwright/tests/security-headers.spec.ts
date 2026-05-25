import { expect, test } from "@playwright/test";

const cspHeaderName =
  process.env.CSP_MODE === "enforce"
    ? "content-security-policy"
    : "content-security-policy-report-only";

const oppositeCspHeaderName =
  cspHeaderName === "content-security-policy"
    ? "content-security-policy-report-only"
    : "content-security-policy";

const expectCspHeaderForMode = (headers: Record<string, string>) => {
  expect(headers[cspHeaderName]).toBeTruthy();
  expect(headers[oppositeCspHeaderName]).toBeUndefined();
};

test.describe("security headers", () => {
  const unsafeInline = ["'unsafe", "-inline'"].join("");

  test("public top page emits CSP and Permissions-Policy for configured mode", async ({
    request,
  }) => {
    const res = await request.get("/");
    const headers = res.headers();

    expect(res.status()).toBe(200);
    expectCspHeaderForMode(headers);
    expect(headers["permissions-policy"]).toBeTruthy();
    expect(headers["x-frame-options"]).toBe("DENY");
  });

  test("login page emits security headers", async ({ request }) => {
    const res = await request.get("/login");
    const headers = res.headers();

    expect(res.status()).toBe(200);
    expectCspHeaderForMode(headers);
    expect(headers["permissions-policy"]).toBeTruthy();
    expect(headers["x-content-type-options"]).toBe("nosniff");
  });

  test("admin redirect emits CSP and Permissions-Policy for configured mode", async ({
    request,
  }) => {
    const res = await request.get("/admin", { maxRedirects: 0 });
    const headers = res.headers();

    expect([307, 308]).toContain(res.status());
    expectCspHeaderForMode(headers);
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
    expectCspHeaderForMode(headers);
    expect(headers["permissions-policy"]).toBeTruthy();
  });

  test("CSP connect-src includes configured API base URL", async ({
    request,
  }) => {
    const res = await request.get("/admin", { maxRedirects: 0 });
    const headers = res.headers();
    const csp = headers[cspHeaderName] ?? "";

    expectCspHeaderForMode(headers);
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
