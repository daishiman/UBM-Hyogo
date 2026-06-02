import { describe, expect, it } from "vitest";
import {
  buildBindingPolicyDrift,
  parseActiveBindings,
  type ActiveBindings,
} from "../binding-policy-drift.ts";
import type { CanonicalPolicy } from "../types.ts";

function policy(name: string, enabled: boolean): CanonicalPolicy {
  return {
    name,
    description: name,
    alert_type: "billing_usage_alert",
    enabled,
    conditions: { metric: "test_metric", threshold: 1 },
    mechanisms: { webhooks: [{ name: "ut-17-relay" }] },
  };
}

function policies(kvEnabled: boolean, r2Enabled: boolean): CanonicalPolicy[] {
  return [
    policy("workers-kv-writes-per-day", kvEnabled),
    policy("workers-kv-stored-bytes", kvEnabled),
    policy("r2-class-a", r2Enabled),
  ];
}

function drift(activeBindings: ActiveBindings, kvEnabled: boolean, r2Enabled: boolean) {
  return buildBindingPolicyDrift(activeBindings, policies(kvEnabled, r2Enabled));
}

describe("parseActiveBindings", () => {
  it("treats commented KV blocks as inactive and uncommented R2 blocks as active", () => {
    const parsed = parseActiveBindings(`
# [[env.production.kv_namespaces]]
# binding = "ALERT_DEDUP_KV"

[[env.production.r2_buckets]]
binding = "MEMBER_PHOTOS"

[[env.staging.r2_buckets]]
binding = "MEMBER_PHOTOS"
`);

    expect(parsed).toEqual({ kv: [], r2: ["MEMBER_PHOTOS"] });
  });

  it("aggregates production and staging bindings by kind", () => {
    const parsed = parseActiveBindings(`
[[env.production.kv_namespaces]]
binding = "ALERT_DEDUP_KV"

[[env.staging.kv_namespaces]]
binding = "SESSION_KV"

[[r2_buckets]]
binding = "UBM_AUDIT_COLD_STORAGE"
`);

    expect(parsed).toEqual({
      kv: ["ALERT_DEDUP_KV", "SESSION_KV"],
      r2: ["UBM_AUDIT_COLD_STORAGE"],
    });
  });

  it("accepts inline comments on active section and binding lines", () => {
    const parsed = parseActiveBindings(`
[[env.production.kv_namespaces]] # active KV section
binding = "ALERT_DEDUP_KV" # namespace id is intentionally omitted in this fixture

# [[env.staging.kv_namespaces]] # still inactive because the whole line is commented
# binding = "SESSION_KV"
`);

    expect(parsed).toEqual({
      kv: ["ALERT_DEDUP_KV"],
      r2: [],
    });
  });
});

describe("buildBindingPolicyDrift", () => {
  it("returns no drift for active bindings with enabled policies", () => {
    expect(drift({ kv: ["ALERT_DEDUP_KV"], r2: ["MEMBER_PHOTOS"] }, true, true)).toEqual([]);
  });

  it("returns no drift for inactive bindings with disabled policies", () => {
    expect(drift({ kv: [], r2: [] }, false, false)).toEqual([]);
  });

  it("reports MONITORING_GAP when active KV bindings have disabled policies", () => {
    const result = drift({ kv: ["ALERT_DEDUP_KV"], r2: ["MEMBER_PHOTOS"] }, false, true);

    expect(result).toEqual([
      {
        kind: "MONITORING_GAP",
        bindingKind: "kv",
        policy: "workers-kv-writes-per-day",
        policyName: "workers-kv-writes-per-day",
        activeBindings: ["ALERT_DEDUP_KV"],
        policyEnabled: false,
        message:
          "kv binding active (ALERT_DEDUP_KV) but alert policy 'workers-kv-writes-per-day' is enabled:false or missing",
      },
      {
        kind: "MONITORING_GAP",
        bindingKind: "kv",
        policy: "workers-kv-stored-bytes",
        policyName: "workers-kv-stored-bytes",
        activeBindings: ["ALERT_DEDUP_KV"],
        policyEnabled: false,
        message:
          "kv binding active (ALERT_DEDUP_KV) but alert policy 'workers-kv-stored-bytes' is enabled:false or missing",
      },
    ]);
  });

  it("reports STALE_MONITORING when inactive R2 bindings have enabled policy", () => {
    const result = drift({ kv: [], r2: [] }, false, true);

    expect(result).toEqual([
      {
        kind: "STALE_MONITORING",
        bindingKind: "r2",
        policy: "r2-class-a",
        policyName: "r2-class-a",
        activeBindings: [],
        policyEnabled: true,
        message: "alert policy 'r2-class-a' is enabled but r2 binding is inactive",
      },
    ]);
  });

  it("reports missing mapped policies as MONITORING_GAP instead of throwing", () => {
    const result = buildBindingPolicyDrift(
      { kv: ["ALERT_DEDUP_KV"], r2: [] },
      [policy("workers-kv-writes-per-day", true), policy("r2-class-a", false)],
    );

    expect(result).toEqual([
      {
        kind: "MONITORING_GAP",
        bindingKind: "kv",
        policy: "workers-kv-stored-bytes",
        policyName: "workers-kv-stored-bytes",
        activeBindings: ["ALERT_DEDUP_KV"],
        policyEnabled: false,
        message:
          "kv binding active (ALERT_DEDUP_KV) but alert policy 'workers-kv-stored-bytes' is enabled:false or missing",
      },
    ]);
  });

  it("reports multiple KV and R2 drifts in one pass", () => {
    const result = drift({ kv: ["ALERT_DEDUP_KV"], r2: [] }, false, true);

    expect(result.map((item) => `${item.kind}:${item.policy}`)).toEqual([
      "MONITORING_GAP:workers-kv-writes-per-day",
      "MONITORING_GAP:workers-kv-stored-bytes",
      "STALE_MONITORING:r2-class-a",
    ]);
  });
});
