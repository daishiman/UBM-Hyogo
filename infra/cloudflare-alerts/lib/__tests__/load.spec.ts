/**
 * load.ts: infra/cloudflare-alerts の JSON を読み込み quota-base 適用 + canonical 化
 *
 * 期待される 5 policy + 1 webhook が揃って取れることを確認する。
 */
import { describe, it, expect } from "vitest";
import path from "node:path";
import { loadExpected } from "../load.ts";

const REPO_ROOT = path.resolve(__dirname, "../../../..");

describe("loadExpected", () => {
  it("7 policy + 1 webhook を canonical 化して返す", () => {
    const r = loadExpected(REPO_ROOT);
    const names = r.policies.map((p) => p.name).sort();
    expect(names).toEqual([
      "d1-read-queries",
      "d1-write-queries",
      "pages-build",
      "r2-class-a",
      "workers-kv-stored-bytes",
      "workers-kv-writes-per-day",
      "workers-requests",
    ]);
    expect(r.webhooks.map((w) => w.name)).toEqual(["ut-17-relay"]);
  });

  it("workers-kv-writes-per-day の threshold が 800、enabled が false", () => {
    const r = loadExpected(REPO_ROOT);
    const p = r.policies.find((p) => p.name === "workers-kv-writes-per-day");
    expect(p).toBeDefined();
    expect((p!.conditions as { threshold: number }).threshold).toBe(800);
    expect(p!.enabled).toBe(false);
  });

  it("workers-kv-stored-bytes の threshold が 858993459、enabled が false", () => {
    const r = loadExpected(REPO_ROOT);
    const p = r.policies.find((p) => p.name === "workers-kv-stored-bytes");
    expect(p).toBeDefined();
    expect((p!.conditions as { threshold: number }).threshold).toBe(858993459);
    expect(p!.enabled).toBe(false);
  });

  it("workers-requests の threshold が quota-base × 0.8 = 80000", () => {
    const r = loadExpected(REPO_ROOT);
    const workers = r.policies.find((p) => p.name === "workers-requests");
    expect(workers).toBeDefined();
    expect((workers!.conditions as { threshold: number }).threshold).toBe(80000);
  });

  it("r2-class-a が anyOf で 2 conditions を持つ", () => {
    const r = loadExpected(REPO_ROOT);
    const r2 = r.policies.find((p) => p.name === "r2-class-a");
    expect(r2).toBeDefined();
    const conds = r2!.conditions as { anyOf: Array<{ metric: string; threshold: number }> };
    expect(conds.anyOf).toHaveLength(2);
    expect(conds.anyOf[0].threshold).toBe(800000);
    expect(conds.anyOf[1].threshold).toBe(8000000);
  });
});
