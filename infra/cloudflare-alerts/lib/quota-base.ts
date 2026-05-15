/**
 * UT-17-Followup-004: quota-base
 *
 * policy template (`percentage × metric`) と quota-base.json を合成して
 * 閾値絶対値を持つ canonical-ish form を生成する純関数。
 * Phase 7 §7-4 Q1〜Q6 を満たす。
 *
 * 苦戦箇所 6.3 解消: threshold 絶対値は repo に書かず percentage × quotaBase で算出。
 */
import type {
  PolicyTemplate,
  QuotaBase,
  CanonicalPolicy,
  CanonicalConditions,
} from "./types.ts";
import { computeThreshold } from "./resolve.ts";

function requireBase(base: QuotaBase, metric: string): number {
  const v = base.values?.[metric];
  if (v === undefined) {
    throw new Error(`quota base not defined for metric: ${metric}`);
  }
  return v;
}

export function applyQuotaBase(template: PolicyTemplate, base: QuotaBase): CanonicalPolicy {
  const c = template.conditions;
  let conditions: CanonicalConditions;
  if ("anyOf" in c) {
    conditions = {
      anyOf: c.anyOf.map((leaf) => ({
        metric: leaf.metric,
        threshold: computeThreshold(leaf.percentage, requireBase(base, leaf.metric)),
      })),
    };
  } else {
    conditions = {
      metric: c.metric,
      threshold: computeThreshold(c.percentage, requireBase(base, c.metric)),
    };
  }
  return {
    name: template.name,
    description: (template.description ?? "").trimEnd(),
    alert_type: template.alert_type,
    enabled: template.enabled,
    conditions,
    mechanisms: { webhooks: template.mechanisms.webhooks.map((w) => ({ name: w.name })) },
  };
}
