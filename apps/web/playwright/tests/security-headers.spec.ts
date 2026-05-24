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
});
