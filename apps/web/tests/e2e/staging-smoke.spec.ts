import { expect, test } from "@playwright/test";

// Route source of truth:
// docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md
//
// Production guard: BASE URL must point to staging only.
// Fixture guard: ENABLE_STAGING_SMOKE_FIXTURE=1 must be set when fixture
// routes (#18, #19) are exercised.

const BASE = process.env.STAGING_BASE_URL ?? "";

const PUBLIC_ROUTES = [
  "/",
  "/members",
  "/register",
  "/privacy",
  "/terms",
];

const MEMBER_FIXTURE_ID = process.env.STAGING_MEMBER_FIXTURE_ID ?? "";

const AUTH_PROTECTED_ROUTES = [
  "/login",
  "/profile",
  "/admin",
  "/admin/members",
  "/admin/tags",
  "/admin/meetings",
  "/admin/schema",
  "/admin/requests",
  "/admin/identity-conflicts",
  "/admin/audit",
];

const PUBLIC_OK = [200, 301, 302, 307];
const AUTH_OK = [200, 301, 302, 307, 401, 403];
const PUBLIC_OK_OR_404 = [200, 301, 302, 307, 404];

function assertStagingBaseUrl(value: string) {
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  const productionHosts = new Set(
    [
      "ubm-hyogo-web.daishimanju.workers.dev",
      process.env.PRODUCTION_BASE_URL,
      process.env.PRODUCTION_WEB_BASE_URL,
    ]
      .filter(Boolean)
      .map((entry) => new URL(entry as string).hostname.toLowerCase()),
  );
  const looksStaging =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.includes("-staging") ||
    host.startsWith("staging.") ||
    host.includes(".staging.");

  if (productionHosts.has(host) || /(^|[-.])(prod|production)([-.]|$)/.test(host) || !looksStaging) {
    throw new Error(`[staging-smoke] STAGING_BASE_URL must be a known staging host: ${value}`);
  }
}

test.beforeAll(() => {
  if (!BASE) {
    throw new Error("[staging-smoke] STAGING_BASE_URL is required");
  }
  assertStagingBaseUrl(BASE);
  if (process.env.ENABLE_STAGING_SMOKE_FIXTURE !== "1") {
    throw new Error("[staging-smoke] ENABLE_STAGING_SMOKE_FIXTURE=1 is required");
  }
});

test.describe("staging smoke / public", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`GET ${route} returns acceptable status`, async ({ request }) => {
      const res = await request.get(`${BASE}${route}`, { maxRedirects: 0 });
      expect(PUBLIC_OK, `route=${route} status=${res.status()}`).toContain(res.status());
    });
  }

  test("GET /members/{publicMemberId} returns acceptable status", async ({ request }) => {
    const id = MEMBER_FIXTURE_ID || "fixture-1";
    const res = await request.get(`${BASE}/members/${id}`, { maxRedirects: 0 });
    expect(PUBLIC_OK_OR_404, `route=/members/${id} status=${res.status()}`).toContain(res.status());
  });
});

test.describe("staging smoke / auth-protected", () => {
  for (const route of AUTH_PROTECTED_ROUTES) {
    test(`GET ${route} (unauth) returns acceptable status`, async ({ request }) => {
      const res = await request.get(`${BASE}${route}`, { maxRedirects: 0 });
      expect(AUTH_OK, `route=${route} status=${res.status()}`).toContain(res.status());
    });
  }
});

test.describe("staging smoke / 404", () => {
  test("GET /__nonexistent__ returns 404 with not-found message", async ({ page }) => {
    const res = await page.goto(`${BASE}/__nonexistent__`, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(404);
    await expect(page.getByText("ページが見つかりません")).toBeVisible();
  });
});

test.describe("staging smoke / error boundary", () => {
  test("GET /__smoke__/error-boundary renders boundary UI", async ({ page }) => {
    await page.goto(`${BASE}/__smoke__/error-boundary`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByText(/エラーID/)).toBeVisible();
  });

  test("GET /__smoke__/members-list returns acceptable status", async ({ request }) => {
    const res = await request.get(`${BASE}/__smoke__/members-list`, { maxRedirects: 0 });
    expect(PUBLIC_OK, `route=/__smoke__/members-list status=${res.status()}`).toContain(res.status());
  });
});
