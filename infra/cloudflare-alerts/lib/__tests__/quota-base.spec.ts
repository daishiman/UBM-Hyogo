/**
 * Phase 7 §7-4 Q1〜Q6: quota-base テスト
 */
import { describe, it, expect } from "vitest";
import { applyQuotaBase } from "../quota-base.ts";
import type { PolicyTemplate, QuotaBase } from "../types.ts";

const fullBase: QuotaBase = {
  version: 1,
  source: "test",
  values: {
    workers_requests_per_day: 100000,
    d1_read_queries_per_day: 5000000,
    d1_write_queries_per_day: 100000,
    pages_requests_per_month: 100000,
    r2_class_a_per_month: 1000000,
    r2_class_b_per_month: 10000000,
  },
};

const tpl = (metric: string, percentage = 0.8): PolicyTemplate => ({
  name: metric.replace(/_/g, "-"),
  description: `${metric} 80%`,
  alert_type: "billing_usage_alert",
  enabled: true,
  conditions: { metric, percentage },
  mechanisms: { webhooks: [{ name: "ut-17-relay" }] },
});

describe("applyQuotaBase", () => {
  it("Q1: workers の threshold が base × 0.8", () => {
    const r = applyQuotaBase(tpl("workers_requests_per_day"), fullBase);
    expect((r.conditions as { threshold: number }).threshold).toBe(80000);
  });

  it("Q2: D1 read", () => {
    const r = applyQuotaBase(tpl("d1_read_queries_per_day"), fullBase);
    expect((r.conditions as { threshold: number }).threshold).toBe(4000000);
  });

  it("Q3: D1 write", () => {
    const r = applyQuotaBase(tpl("d1_write_queries_per_day"), fullBase);
    expect((r.conditions as { threshold: number }).threshold).toBe(80000);
  });

  it("Q4: Pages", () => {
    const r = applyQuotaBase(tpl("pages_requests_per_month"), fullBase);
    expect((r.conditions as { threshold: number }).threshold).toBe(80000);
  });

  it("Q5: R2 Class A + Class B (anyOf 2 conditions)", () => {
    const r2Template: PolicyTemplate = {
      name: "r2-class-a",
      description: "R2",
      alert_type: "billing_usage_alert",
      enabled: true,
      conditions: {
        anyOf: [
          { metric: "r2_class_a_per_month", percentage: 0.8 },
          { metric: "r2_class_b_per_month", percentage: 0.8 },
        ],
      },
      mechanisms: { webhooks: [{ name: "ut-17-relay" }] },
    };
    const r = applyQuotaBase(r2Template, fullBase);
    const conds = r.conditions as { anyOf: Array<{ metric: string; threshold: number }> };
    expect(conds.anyOf[0]).toEqual({ metric: "r2_class_a_per_month", threshold: 800000 });
    expect(conds.anyOf[1]).toEqual({ metric: "r2_class_b_per_month", threshold: 8000000 });
  });

  it("Q6: 未知 metric で例外", () => {
    expect(() => applyQuotaBase(tpl("unknown_metric"), fullBase)).toThrow(/unknown_metric/);
  });
});
