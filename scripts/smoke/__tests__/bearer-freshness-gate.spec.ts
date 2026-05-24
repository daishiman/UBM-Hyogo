import { describe, expect, it } from "vitest";
import { signSessionJwt } from "@ubm-hyogo/shared";
import {
  classifyBearerFreshness,
  decodeJwtExp,
  decodeJwtSubject,
  evaluateFreshnessGate,
  explainAuthFailureFromBearer,
} from "../bearer-freshness-gate.mts";

const SECRET = "test-secret-freshness";
const NOW = 1_800_000_000;

describe("bearer-freshness-gate", () => {
  it("classifies a bearer above threshold as fresh", async () => {
    const token = await signSessionJwt(SECRET, {
      memberId: "member-1",
      email: "member@example.com",
      isAdmin: true,
      nowSeconds: NOW,
      ttlSeconds: 21_601,
    });
    expect(classifyBearerFreshness({ label: "admin", token, nowSeconds: NOW }).status).toBe("fresh");
  });

  it("classifies a bearer below threshold as stale", async () => {
    const token = await signSessionJwt(SECRET, {
      memberId: "member-1",
      email: "member@example.com",
      isAdmin: true,
      nowSeconds: NOW,
      ttlSeconds: 100,
    });
    expect(classifyBearerFreshness({ label: "admin", token, nowSeconds: NOW }).status).toBe("stale");
  });

  it("classifies expired and malformed bearer without exposing token content", async () => {
    const expired = await signSessionJwt(SECRET, {
      memberId: "member-1",
      email: "member@example.com",
      isAdmin: true,
      nowSeconds: NOW - 200,
      ttlSeconds: 100,
    });
    expect(classifyBearerFreshness({ label: "admin", token: expired, nowSeconds: NOW }).status).toBe(
      "expired",
    );
    expect(decodeJwtExp("not-a-jwt")).toBeNull();
    expect(classifyBearerFreshness({ label: "admin", token: "not-a-jwt", nowSeconds: NOW }).status).toBe(
      "invalid",
    );
  });

  it("splits 401 diagnostics into expired vs secret drift", async () => {
    const expired = await signSessionJwt(SECRET, {
      memberId: "member-1",
      email: "member@example.com",
      isAdmin: true,
      nowSeconds: NOW - 200,
      ttlSeconds: 100,
    });
    const future = await signSessionJwt(SECRET, {
      memberId: "member-1",
      email: "member@example.com",
      isAdmin: true,
      nowSeconds: NOW,
      ttlSeconds: 600,
    });
    expect(explainAuthFailureFromBearer({ token: expired, nowSeconds: NOW })).toBe("auth-token-expired");
    expect(explainAuthFailureFromBearer({ token: future, nowSeconds: NOW })).toBe("auth-secret-drift");
  });

  it("decodes the JWT subject (memberId) for the production allowlist", async () => {
    const token = await signSessionJwt(SECRET, {
      memberId: "member-allow-1",
      email: "member@example.com",
      isAdmin: false,
      nowSeconds: NOW,
      ttlSeconds: 600,
    });
    expect(decodeJwtSubject(token)).toBe("member-allow-1");
    expect(decodeJwtSubject("not-a-jwt")).toBeNull();
  });

  describe("evaluateFreshnessGate", () => {
    async function staleToken() {
      return signSessionJwt(SECRET, {
        memberId: "member-1",
        email: "member@example.com",
        isAdmin: true,
        nowSeconds: NOW,
        ttlSeconds: 100,
      });
    }

    it("warn-only mode does not fail on a stale bearer (exit 0, warning level)", async () => {
      const outcome = evaluateFreshnessGate({
        checks: [{ label: "STAGING_ADMIN_BEARER", token: await staleToken() }],
        thresholdSeconds: 21_600,
        enforce: false,
        nowSeconds: NOW,
        authPath: "static-fallback",
      });
      expect(outcome.exitCode).toBe(0);
      expect(outcome.messages.some((m) => m.level === "warning")).toBe(true);
      expect(outcome.messages.some((m) => m.level === "error")).toBe(false);
    });

    it("enforce mode fails on a stale bearer (exit 1, error level)", async () => {
      const outcome = evaluateFreshnessGate({
        checks: [{ label: "STAGING_ADMIN_BEARER", token: await staleToken() }],
        thresholdSeconds: 21_600,
        enforce: true,
        nowSeconds: NOW,
        authPath: "minted",
      });
      expect(outcome.exitCode).toBe(1);
      expect(outcome.messages.some((m) => m.level === "error")).toBe(true);
    });

    it("passes (exit 0) when every bearer is fresh, regardless of enforce flag", async () => {
      const fresh = await signSessionJwt(SECRET, {
        memberId: "member-1",
        email: "member@example.com",
        isAdmin: true,
        nowSeconds: NOW,
        ttlSeconds: 21_601,
      });
      for (const enforce of [true, false]) {
        const outcome = evaluateFreshnessGate({
          checks: [{ label: "STAGING_ADMIN_BEARER", token: fresh }],
          thresholdSeconds: 21_600,
          enforce,
          nowSeconds: NOW,
        });
        expect(outcome.exitCode).toBe(0);
        expect(outcome.messages.some((m) => m.level === "error" || m.level === "warning")).toBe(false);
      }
    });
  });
});
