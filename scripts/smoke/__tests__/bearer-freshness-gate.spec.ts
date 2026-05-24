import { describe, expect, it } from "vitest";
import { signSessionJwt } from "@ubm-hyogo/shared";
import {
  classifyBearerFreshness,
  decodeJwtExp,
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
});
