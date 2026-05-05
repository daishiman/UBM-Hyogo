import { describe, expect, it } from "vitest";
import { classifySyncError, redactMetricsJson } from "../sync-error";

describe("classifySyncError", () => {
  it("classifies lock conflicts", () => {
    expect(classifySyncError(new Error("sync lock already held"))).toBe(
      "lock-conflict",
    );
  });

  it("classifies fetch and upstream failures", () => {
    expect(classifySyncError(new Error("HTTP 503 Service Unavailable"))).toBe(
      "fetch-failed",
    );
    expect(classifySyncError(new Error("429 quota exceeded"))).toBe(
      "fetch-failed",
    );
  });

  it("classifies D1 write failures", () => {
    expect(classifySyncError(new Error("UNIQUE constraint failed"))).toBe(
      "d1-write-failed",
    );
  });

  it("falls back to unknown", () => {
    expect(classifySyncError(new Error("unexpected"))).toBe("unknown");
  });
});

describe("redactMetricsJson", () => {
  it("drops PII keys without mutating non-PII metrics", () => {
    expect(
      redactMetricsJson({
        count: 3,
        duration: 1,
        email: "a@example.com",
        responseEmail: "b@example.com",
        responseId: "r_001",
      }),
    ).toEqual({ count: 3, duration: 1 });
  });
});
