import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { getClassifier } from "../classifier/index.ts";
import { replay } from "../evaluation/offline-replay.ts";
import { scanForSecrets, scanInputs } from "../evaluation/secret-leakage-grep.ts";
import type { LabeledAuditEvent } from "../evaluation/offline-replay.ts";

const rows: LabeledAuditEvent[] = [
  {
    expectedSeverity: "HIGH",
    event: {
      id: "a-1",
      when: "2026-05-07T05:00:00Z",
      actor: { email: "ci@example.com", ip: "203.0.113.5" },
      action: { type: "token.read", result: "success" },
    },
  },
  {
    expectedSeverity: "NONE",
    event: {
      id: "n-1",
      when: "2026-05-07T05:00:00Z",
      actor: { email: "ci@example.com", ip: "140.82.115.10" },
      action: { type: "token.read", result: "success" },
    },
  },
];

describe("offline replay and leakage scan", () => {
  it("computes replay metrics", () => {
    const metrics = replay(rows, getClassifier({}));
    expect(metrics.totalEvents).toBe(2);
    expect(metrics.truePositive).toBe(1);
    expect(metrics.trueNegative).toBe(1);
    expect(metrics.precision).toBe(1);
  });

  it("detects raw secrets in positive fixtures", () => {
    expect(
      scanForSecrets("tests/fixtures/cf-audit/leakage-clean.jsonl").hits,
    ).toEqual([]);
    expect(
      scanForSecrets("tests/fixtures/cf-audit/leakage-positive-ip.jsonl").hits,
    ).not.toEqual([]);
  });

  it("scans evidence directories recursively", () => {
    const result = scanInputs(["tests/fixtures/cf-audit"]);
    expect(result.hits.some((hit) => hit.file?.endsWith("leakage-positive-ip.jsonl"))).toBe(
      true,
    );
  });

  it("supports stdin count-only CLI contract", () => {
    const result = spawnSync(
      process.execPath,
      [
        "--experimental-strip-types",
        "scripts/cf-audit-log/evaluation/secret-leakage-grep.ts",
        "--stdin",
        "--count-only",
      ],
      { input: "actor=ci@example.com\n", encoding: "utf8" },
    );
    expect(result.status).toBe(1);
    expect(result.stdout.trim()).toBe("1");
  });
});
