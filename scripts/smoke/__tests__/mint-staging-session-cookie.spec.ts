import { describe, expect, it } from "vitest";
import { decodeAuthSessionJwt, verifySessionJwt } from "@ubm-hyogo/shared";
import { mintStagingSessionCookie } from "../mint-staging-session-cookie.mts";

const SECRET = "test-secret-admin-cookie";

const baseInput = {
  authSecret: SECRET,
  memberId: "admin-member-id",
  email: "admin@example.com",
  isAdmin: true,
} as const;

function tokenFromCookie(cookie: string): string {
  return cookie.split("=").slice(1).join("=");
}

describe("mintStagingSessionCookie", () => {
  it("creates the Auth.js session cookie name used by middleware", async () => {
    const cookie = await mintStagingSessionCookie(baseInput);
    expect(cookie.startsWith("__Secure-authjs.session-token=")).toBe(true);
    expect(tokenFromCookie(cookie)).not.toHaveLength(0);
  });

  it("uses the same HS256 session JWT contract as Auth.js encode/decode adapter", async () => {
    const cookie = await mintStagingSessionCookie(baseInput);
    const token = tokenFromCookie(cookie);
    const claims = await decodeAuthSessionJwt(SECRET, token);
    expect(claims).not.toBeNull();
    expect(claims!.memberId).toBe(baseInput.memberId);
    expect(claims!.email).toBe(baseInput.email);
    expect(claims!.isAdmin).toBe(true);
  });

  it("honors ttlSeconds", async () => {
    const cookie = await mintStagingSessionCookie({ ...baseInput, ttlSeconds: 600 });
    const token = tokenFromCookie(cookie);
    const payloadSegment = token.split(".")[1]!;
    const padded = payloadSegment.replace(/-/g, "+").replace(/_/g, "/") +
      "===".slice((payloadSegment.length + 3) % 4);
    const payload = JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as { iat: number };
    expect(await verifySessionJwt(token, SECRET, payload.iat + 599)).not.toBeNull();
    expect(await verifySessionJwt(token, SECRET, payload.iat + 601)).toBeNull();
  });

  it("supports non-secure fallback cookie name for local probes", async () => {
    const cookie = await mintStagingSessionCookie({
      ...baseInput,
      cookieName: "authjs.session-token",
    });
    expect(cookie.startsWith("authjs.session-token=")).toBe(true);
  });

  it("rejects missing secret without returning a token", async () => {
    await expect(
      mintStagingSessionCookie({ ...baseInput, authSecret: "" }),
    ).rejects.toThrow(/AUTH_SECRET missing/);
  });
});
