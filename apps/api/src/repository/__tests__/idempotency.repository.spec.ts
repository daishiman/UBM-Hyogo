import { describe, expect, it } from "vitest";
import { isExpired, shouldReplay, type IdempotencyRecord } from "../idempotency.repository";

const baseRecord: IdempotencyRecord = {
  id: "idem-1",
  key: "key-1",
  method: "POST",
  path: "/admin/example",
  requestFingerprint: "fp-1",
  status: "completed",
  responseStatus: 201,
  responseBody: "{\"ok\":true}",
  responseContentType: "application/json",
  createdAt: "2026-05-25T00:00:00.000Z",
  completedAt: "2026-05-25T00:00:01.000Z",
  expiresAt: "2026-05-26T00:00:00.000Z",
};

describe("idempotency repository pure decisions", () => {
  it("isExpired treats equality as expired for lazy GC", () => {
    expect(isExpired(baseRecord, "2026-05-26T00:00:00.000Z")).toBe(true);
    expect(isExpired(baseRecord, "2026-05-25T23:59:59.999Z")).toBe(false);
  });

  it("shouldReplay returns replay for completed matching fingerprint", () => {
    expect(shouldReplay(baseRecord, "fp-1", "2026-05-25T00:01:00.000Z").type).toBe(
      "replay",
    );
  });

  it("shouldReplay detects in-flight and fingerprint mismatch before replay", () => {
    expect(
      shouldReplay({ ...baseRecord, status: "in_flight" }, "fp-1", "2026-05-25T00:01:00.000Z")
        .type,
    ).toBe("in_flight");
    expect(shouldReplay(baseRecord, "other", "2026-05-25T00:01:00.000Z").type).toBe(
      "fingerprint_mismatch",
    );
  });
});
