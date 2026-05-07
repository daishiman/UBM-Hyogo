import { describe, expect, it } from "vitest";
import { extractFeatures } from "../features/extract.ts";
import type { AuditLogEvent } from "../types.ts";

function event(overrides: Partial<AuditLogEvent> = {}): AuditLogEvent {
  return {
    id: "e-1",
    when: "2026-05-07T15:30:00Z",
    actor: {
      email: "operator@example.com",
      ip: "203.0.113.77",
      user_agent: "Mozilla/5.0 Chrome/123",
    },
    action: { type: "token.read", result: "failure", result_code: 403 },
    ...overrides,
  };
}

describe("extractFeatures", () => {
  it("returns redacted features without raw actor values", () => {
    const features = extractFeatures(event(), { redactSecret: "test-secret" });
    expect(features.ipBucket).toBe("203.0.113.0/24");
    expect(features.hourOfDay).toBe(15);
    expect(features.dayOfWeek).toBe(4);
    expect(features.actionCategory).toBe("tokens");
    expect(features.statusClass).toBe("4xx");
    expect(features.actorRoleHash).toMatch(/^[0-9a-f]{16}$/);
    expect(features.userAgentCategory).toBe("browser");
    expect(features.tokenIdPresent).toBe(true);
    const serialized = JSON.stringify(features);
    expect(serialized).not.toContain("operator@example.com");
    expect(serialized).not.toContain("203.0.113.77");
    expect(serialized).not.toContain("Mozilla/5.0");
  });

  it("requires a redaction secret", () => {
    expect(() => extractFeatures(event(), { redactSecret: "" })).toThrow(
      /redactSecret/,
    );
  });
});

