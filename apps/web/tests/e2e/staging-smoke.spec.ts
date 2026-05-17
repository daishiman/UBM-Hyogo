import { expect, test } from '../../playwright/fixtures/coverage';

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

function parseOptionalHostname(value: string | undefined) {
  if (!value) {
    return undefined;
  }
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

function assertStagingBaseUrl(value: string) {
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  const productionHosts = new Set(
    [
      "ubm-hyogo-web.daishimanju.workers.dev",
      parseOptionalHostname(process.env.PRODUCTION_BASE_URL),
      parseOptionalHostname(process.env.PRODUCTION_WEB_BASE_URL),
    ]
      .filter(Boolean)
      .map((entry) => entry as string),
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

function assertSmokeFixtureEnabled() {
  if (process.env.ENABLE_STAGING_SMOKE_FIXTURE !== "1") {
    throw new Error("[staging-smoke] ENABLE_STAGING_SMOKE_FIXTURE=1 is required for smoke fixture routes");
  }
}

test.beforeAll(() => {
  if (!BASE) {
    throw new Error("[staging-smoke] STAGING_BASE_URL is required");
  }
  assertStagingBaseUrl(BASE);
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
  test.beforeAll(() => {
    assertSmokeFixtureEnabled();
  });

  test("GET /smoke/error-boundary renders boundary UI", async ({ page }) => {
    await page.goto(`${BASE}/smoke/error-boundary`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByText(/エラーID/)).toBeVisible();
  });

  test("GET /smoke/members-list returns acceptable status", async ({ request }) => {
    const res = await request.get(`${BASE}/smoke/members-list`, { maxRedirects: 0 });
    expect(PUBLIC_OK, `route=/smoke/members-list status=${res.status()}`).toContain(res.status());
  });
});

test.describe("staging smoke / loading state", () => {
  test.beforeAll(() => {
    assertSmokeFixtureEnabled();
  });

  test("GET /smoke/loading-state streams loading boundary then final render", async ({ page, request }) => {
    const streamed = await request.get(`${BASE}/smoke/loading-state?delay=1000`);
    expect(streamed.status()).toBe(200);
    const html = await streamed.text();
    expect(html).toContain('data-page="smoke-loading-state"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("読み込み中");
    expect(html).toContain('data-page="smoke-loading-state-fixture"');

    const res = await page.goto(`${BASE}/smoke/loading-state?delay=1000`, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page.locator('[data-page="smoke-loading-state-fixture"]')).toBeVisible();
    await expect(page.locator('[data-page="smoke-loading-state"]')).toHaveCount(0);
  });

  test("GET /smoke/loading-state?delay=0 renders final fixture", async ({ page }) => {
    const res = await page.goto(`${BASE}/smoke/loading-state?delay=0`, { waitUntil: "domcontentloaded" });

    expect(res?.status()).toBe(200);
    await expect(page.locator('[data-page="smoke-loading-state-fixture"]')).toBeVisible();
    await expect(page.getByText("delay-ms: 0")).toBeVisible();
  });

  test("GET /smoke/loading-state?delay=3500 clamps delay to 3000", async ({ page }) => {
    const startedAt = Date.now();
    await page.goto(`${BASE}/smoke/loading-state?delay=3500`, { waitUntil: "domcontentloaded" });

    await expect(page.locator('[data-page="smoke-loading-state-fixture"]')).toBeVisible();
    await expect(page.getByText("delay-ms: 3000")).toBeVisible();
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(2000);
  });

  test("GET /smoke/loading-state?delay=abc falls back to default delay", async ({ page }) => {
    await page.goto(`${BASE}/smoke/loading-state?delay=abc`, { waitUntil: "domcontentloaded" });

    await expect(page.locator('[data-page="smoke-loading-state-fixture"]')).toBeVisible();
    await expect(page.getByText("delay-ms: 1500")).toBeVisible();
  });

  test("GET /smoke/loading-state?delay=-1 falls back to default delay", async ({ page }) => {
    await page.goto(`${BASE}/smoke/loading-state?delay=-1`, { waitUntil: "domcontentloaded" });

    await expect(page.locator('[data-page="smoke-loading-state-fixture"]')).toBeVisible();
    await expect(page.getByText("delay-ms: 1500")).toBeVisible();
  });
});
