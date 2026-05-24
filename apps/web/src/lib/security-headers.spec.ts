import { describe, expect, it } from "vitest";

import {
  applySecurityHeaders,
  buildSecurityHeaders,
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
});
