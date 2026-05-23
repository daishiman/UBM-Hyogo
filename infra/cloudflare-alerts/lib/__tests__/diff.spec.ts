/**
 * Phase 7 §7-3 D1〜D8: diff テスト
 */
import { describe, it, expect } from "vitest";
import { diffPolicy, diffWebhook } from "../diff.ts";
import type { CanonicalPolicy, CanonicalWebhook } from "../types.ts";

const policy = (
  name: string,
  threshold: number,
  webhookName = "ut-17-relay",
  enabled = true,
): CanonicalPolicy => ({
  name,
  description: `${name} 80%`,
  alert_type: "billing_usage_alert",
  enabled,
  conditions: { metric: "workers_requests_per_day", threshold },
  mechanisms: { webhooks: [{ name: webhookName }] },
});

const fivePolicies = (): CanonicalPolicy[] => [
  policy("workers-requests", 80000),
  policy("d1-read-queries", 4000000),
  policy("d1-write-queries", 80000),
  policy("pages-build", 80000),
  policy("r2-class-a", 800000),
];

describe("diffPolicy", () => {
  it("D1: 一致時は空配列を返す", () => {
    const e = fivePolicies();
    const a = fivePolicies();
    expect(diffPolicy(e, a)).toEqual([]);
  });

  it("D2: actual に存在しない policy は missing として報告", () => {
    const e = fivePolicies();
    const a = e.filter((p) => p.name !== "workers-requests");
    const d = diffPolicy(e, a);
    expect(d).toEqual([{ kind: "missing", name: "workers-requests" }]);
  });

  it("D3: actual にだけ存在する policy は extra として報告", () => {
    const e = fivePolicies();
    const a = [...fivePolicies(), policy("unknown-extra", 999)];
    const d = diffPolicy(e, a);
    expect(d).toEqual([{ kind: "extra", name: "unknown-extra" }]);
  });

  it("D4: threshold だけ違う場合は changed + path で報告", () => {
    const e = fivePolicies();
    const a = fivePolicies();
    a[0].conditions = { metric: "workers_requests_per_day", threshold: 90000 };
    const d = diffPolicy(e, a);
    expect(d).toEqual([
      {
        kind: "changed",
        name: "workers-requests",
        path: "conditions.threshold",
        expected: 80000,
        actual: 90000,
      },
    ]);
  });

  it("D5: webhook mapping が変わった場合も changed", () => {
    const e = fivePolicies();
    const a = fivePolicies();
    a[0].mechanisms.webhooks[0] = { name: "old-relay" };
    const d = diffPolicy(e, a);
    expect(d).toEqual([
      {
        kind: "changed",
        name: "workers-requests",
        path: "mechanisms.webhooks[0].name",
        expected: "ut-17-relay",
        actual: "old-relay",
      },
    ]);
  });

  it("D6: 複数 drift を全件返す (早期 return しない)", () => {
    const e = fivePolicies();
    const a = fivePolicies();
    a[0].conditions = { metric: "workers_requests_per_day", threshold: 90000 };
    const aFiltered = a.filter((p) => p.name !== "pages-build");
    const d = diffPolicy(e, aFiltered);
    expect(d).toHaveLength(2);
  });

  it("D7: enabled flag の差分も changed で報告", () => {
    const e = fivePolicies();
    const a = fivePolicies();
    a[0].enabled = false;
    const d = diffPolicy(e, a);
    expect(d).toEqual([
      {
        kind: "changed",
        name: "workers-requests",
        path: "enabled",
        expected: true,
        actual: false,
      },
    ]);
  });
});

describe("diffWebhook", () => {
  it("D8: name 単位で照合し url 違いを changed として返す", () => {
    const e: CanonicalWebhook[] = [
      { name: "ut-17-relay", type: "generic", url: "https://a.invalid/" },
    ];
    const a: CanonicalWebhook[] = [
      { name: "ut-17-relay", type: "generic", url: "https://b.invalid/" },
    ];
    const d = diffWebhook(e, a);
    expect(d).toEqual([
      {
        kind: "changed",
        name: "ut-17-relay",
        path: "url",
        expected: "https://a.invalid/",
        actual: "https://b.invalid/",
      },
    ]);
  });
});
