import { describe, expect, it } from "vitest";

import {
  applySecurityHeaders,
  buildReportToHeader,
  buildReportingEndpointsHeader,
  buildSecurityHeaders,
  buildSentryCspReportUrl,
  type SecurityHeaderConfig,
} from "./security-headers";

const cfg: SecurityHeaderConfig = {
  cspMode: "report-only",
  apiBaseUrl: "https://api.example.com",
  authOrigin: "https://accounts.google.com",
};

const nonceCfg: SecurityHeaderConfig = {
  ...cfg,
  nonce: "test-nonce",
};

const unsafeInline = ["'unsafe", "-inline'"].join("");

const reportCfg: SecurityHeaderConfig = {
  ...cfg,
  reportEndpoint: "https://o123.ingest.sentry.io/api/456/security/?sentry_key=abc",
};

describe("security headers", () => {
  it("builds report-only CSP by default", () => {
    const headers = buildSecurityHeaders(cfg);

    expect(headers.get("Content-Security-Policy-Report-Only")).toBeTruthy();
    expect(headers.get("Content-Security-Policy")).toBeNull();
  });

  it("limits connect-src to self, API base URL, and auth origin", () => {
    const csp = buildSecurityHeaders(cfg).get(
      "Content-Security-Policy-Report-Only",
    );

    expect(csp).toContain(
      "connect-src 'self' https://api.example.com https://accounts.google.com",
    );
  });

  it("does not enable Trusted Types enforcement", () => {
    const csp = buildSecurityHeaders(cfg).get(
      "Content-Security-Policy-Report-Only",
    );

    expect(csp).not.toContain("require-trusted-types-for");
    expect(csp).not.toContain("trusted-types");
  });

  it("builds nonce CSP without script-src or style-src inline fallback", () => {
    const csp = buildSecurityHeaders(nonceCfg).get(
      "Content-Security-Policy-Report-Only",
    );

    expect(csp).toContain("script-src 'self' 'nonce-test-nonce' 'strict-dynamic'");
    expect(csp).toContain("style-src 'self' 'nonce-test-nonce'");
    expect(csp).toContain("style-src-elem 'self' 'nonce-test-nonce'");
    expect(csp).toContain(`style-src-attr ${unsafeInline}`);
    expect(csp).not.toContain(`script-src 'self' ${unsafeInline}`);
    expect(csp).not.toContain(`style-src 'self' ${unsafeInline}`);
  });

  it("does not emit browsing-topics in Permissions-Policy", () => {
    const policy = buildSecurityHeaders(cfg).get("Permissions-Policy");

    expect(policy).not.toContain("browsing-topics");
  });

  it("disables privacy-sensitive browser features", () => {
    const policy = buildSecurityHeaders(cfg).get("Permissions-Policy");

    expect(policy).toContain("camera=()");
    expect(policy).toContain("microphone=()");
    expect(policy).toContain("geolocation=()");
  });

  it("builds enforce CSP when requested", () => {
    const headers = buildSecurityHeaders({ ...cfg, cspMode: "enforce" });

    expect(headers.get("Content-Security-Policy")).toBeTruthy();
    expect(headers.get("Content-Security-Policy-Report-Only")).toBeNull();
  });

  it("merges security headers without dropping existing headers", () => {
    const response = new Response("ok", {
      headers: { "x-existing": "kept" },
    });

    const result = applySecurityHeaders(response, cfg);

    expect(result.headers.get("x-existing")).toBe("kept");
    expect(result.headers.get("Content-Security-Policy-Report-Only")).toBeTruthy();
  });

  it("emits hardening headers", () => {
    const headers = buildSecurityHeaders(cfg);

    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("derives the Sentry CSP security endpoint from a public browser DSN", () => {
    expect(buildSentryCspReportUrl("https://abc123@o456.ingest.sentry.io/789")).toBe(
      "https://o456.ingest.sentry.io/api/789/security/?sentry_key=abc123",
    );
  });

  it("does not derive a report endpoint from an absent or invalid Sentry DSN", () => {
    expect(buildSentryCspReportUrl(undefined)).toBeUndefined();
    expect(buildSentryCspReportUrl("")).toBeUndefined();
    expect(buildSentryCspReportUrl("not-a-url")).toBeUndefined();
  });

  it("emits Reporting-Endpoints when a report endpoint is set", () => {
    const headers = buildSecurityHeaders(reportCfg);

    expect(headers.get("Reporting-Endpoints")).toBe(
      'csp-endpoint="https://o123.ingest.sentry.io/api/456/security/?sentry_key=abc"',
    );
  });

  it("emits legacy Report-To when a report endpoint is set", () => {
    const headers = buildSecurityHeaders(reportCfg);
    const reportTo = JSON.parse(headers.get("Report-To") ?? "{}");

    expect(reportTo).toEqual({
      group: "csp-endpoint",
      max_age: 10886400,
      endpoints: [{ url: "https://o123.ingest.sentry.io/api/456/security/?sentry_key=abc" }],
      include_subdomains: true,
    });
  });

  it("uses the same group name for CSP report-to, Report-To, and Reporting-Endpoints", () => {
    const headers = buildSecurityHeaders(reportCfg);
    const csp = headers.get("Content-Security-Policy-Report-Only");
    const reportingEndpoints = headers.get("Reporting-Endpoints");
    const reportTo = JSON.parse(headers.get("Report-To") ?? "{}");
    const group = reportingEndpoints?.split("=")[0];

    expect(group).toBe("csp-endpoint");
    expect(csp).toContain(`report-to ${group}`);
    expect(reportTo.group).toBe(group);
  });

  it("includes legacy report-uri when a report endpoint is set", () => {
    const csp = buildSecurityHeaders(reportCfg).get(
      "Content-Security-Policy-Report-Only",
    );

    expect(csp).toContain(
      "report-uri https://o123.ingest.sentry.io/api/456/security/?sentry_key=abc",
    );
  });

  it("omits report headers and directives when the report endpoint is unset", () => {
    const headers = buildSecurityHeaders(cfg);
    const csp = headers.get("Content-Security-Policy-Report-Only");

    expect(headers.get("Reporting-Endpoints")).toBeNull();
    expect(headers.get("Report-To")).toBeNull();
    expect(csp).not.toContain("report-to");
    expect(csp).not.toContain("report-uri");
  });

  it("treats a blank report endpoint as disabled", () => {
    const headers = buildSecurityHeaders({ ...cfg, reportEndpoint: "   " });
    const csp = headers.get("Content-Security-Policy-Report-Only");

    expect(headers.get("Reporting-Endpoints")).toBeNull();
    expect(headers.get("Report-To")).toBeNull();
    expect(csp).not.toContain("report-to");
    expect(csp).not.toContain("report-uri");
  });

  it("emits report directives in enforce mode too", () => {
    const headers = buildSecurityHeaders({ ...reportCfg, cspMode: "enforce" });

    expect(headers.get("Content-Security-Policy")).toContain("report-to csp-endpoint");
    expect(headers.get("Reporting-Endpoints")).toBeTruthy();
    expect(headers.get("Report-To")).toBeTruthy();
  });

  it("builds reporting endpoint headers as pure helpers", () => {
    expect(buildReportingEndpointsHeader(reportCfg)).toBe(
      'csp-endpoint="https://o123.ingest.sentry.io/api/456/security/?sentry_key=abc"',
    );
    expect(buildReportingEndpointsHeader(cfg)).toBeNull();
    expect(JSON.parse(buildReportToHeader(reportCfg) ?? "{}")).toMatchObject({
      group: "csp-endpoint",
      endpoints: [{ url: "https://o123.ingest.sentry.io/api/456/security/?sentry_key=abc" }],
    });
    expect(buildReportToHeader(cfg)).toBeNull();
  });
});
