/**
 * Phase 7 §7-2 C1〜C8: canonicalize テスト
 */
import { describe, it, expect } from "vitest";
import { canonicalizePolicy, canonicalizeWebhook } from "../canonicalize.ts";

const apiWorkersEntry = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "workers-requests",
  description: "Workers Requests 80%",
  alert_type: "billing_usage_alert",
  enabled: true,
  conditions: { metric: "workers_requests_per_day", threshold: 80000 },
  mechanisms: { webhooks: [{ id: "11111111-1111-1111-1111-111111111111" }] },
  created: "2026-05-09T00:00:00Z",
  modified: "2026-05-09T00:00:00Z",
  account_id: "redacted",
};

const repoCanonicalWorkers = {
  alert_type: "billing_usage_alert" as const,
  conditions: { metric: "workers_requests_per_day", threshold: 80000 },
  description: "Workers Requests 80%",
  enabled: true,
  mechanisms: { webhooks: [{ name: "ut-17-relay" }] },
  name: "workers-requests",
};

describe("canonicalizePolicy", () => {
  it("C1: キー順序が異なっても同一 canonical を返す", () => {
    const idMap = { "11111111-1111-1111-1111-111111111111": "ut-17-relay" };
    const fromApi = canonicalizePolicy(apiWorkersEntry, idMap);
    const fromRepo = canonicalizePolicy(repoCanonicalWorkers);
    expect(fromApi).toEqual(fromRepo);
  });

  it("C2: server-generated field を除去する", () => {
    const r = canonicalizePolicy(apiWorkersEntry, {
      "11111111-1111-1111-1111-111111111111": "ut-17-relay",
    }) as Record<string, unknown>;
    expect(r.id).toBeUndefined();
    expect(r.created).toBeUndefined();
    expect(r.modified).toBeUndefined();
    expect(r.account_id).toBeUndefined();
  });

  it("C3: threshold が文字列でも number に正規化される", () => {
    const r = canonicalizePolicy({
      name: "x",
      description: "x",
      alert_type: "billing_usage_alert",
      enabled: true,
      conditions: { metric: "workers_requests_per_day", threshold: "80000" },
      mechanisms: { webhooks: [{ name: "ut-17-relay" }] },
    });
    expect((r.conditions as { threshold: number }).threshold).toBe(80000);
  });

  it("C4: description trailing whitespace を除去", () => {
    const r = canonicalizePolicy({
      name: "x",
      description: "Workers Requests 80%   ",
      alert_type: "billing_usage_alert",
      enabled: true,
      conditions: { metric: "workers_requests_per_day", threshold: 80000 },
      mechanisms: { webhooks: [{ name: "ut-17-relay" }] },
    });
    expect(r.description).toBe("Workers Requests 80%");
  });

  it("C5: webhook id を name に置換し id は残らない", () => {
    const r = canonicalizePolicy(
      {
        name: "x",
        description: "x",
        alert_type: "billing_usage_alert",
        enabled: true,
        conditions: { metric: "workers_requests_per_day", threshold: 80000 },
        mechanisms: { webhooks: [{ id: "abc-123" }] },
      },
      { "abc-123": "ut-17-relay" },
    );
    expect(r.mechanisms.webhooks[0]).toEqual({ name: "ut-17-relay" });
    expect((r.mechanisms.webhooks[0] as Record<string, unknown>).id).toBeUndefined();
  });

  it("C6: enabled が boolean のまま保持される", () => {
    const r = canonicalizePolicy({
      name: "x",
      description: "x",
      alert_type: "billing_usage_alert",
      enabled: false,
      conditions: { metric: "workers_requests_per_day", threshold: 80000 },
      mechanisms: { webhooks: [{ name: "ut-17-relay" }] },
    });
    expect(r.enabled).toBe(false);
  });

  it("C7: canonicalizeWebhook が secret field を除去する", () => {
    const r = canonicalizeWebhook({
      secret: "xxx",
      url: "https://example.invalid/",
      name: "ut-17-relay",
      type: "generic",
    }) as Record<string, unknown>;
    expect(r.secret).toBeUndefined();
    expect(r.name).toBe("ut-17-relay");
  });

  it("C8: 入力が null/undefined で型エラーを投げる", () => {
    expect(() => canonicalizePolicy(null)).toThrow();
    expect(() => canonicalizePolicy(undefined)).toThrow();
  });
});
