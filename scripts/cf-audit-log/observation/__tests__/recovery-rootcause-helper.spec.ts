import { describe, expect, it } from "vitest";
import {
  detectMissingHours,
  parseArgs,
  renderRootcauseMarkdown,
} from "../recovery-rootcause-helper.ts";

describe("recovery-rootcause-helper parseArgs", () => {
  it("captures --since / --mark-missing-parent-summary / --classification", () => {
    const args = parseArgs([
      "--since",
      "2026-05-15T01:00:00Z",
      "--mark-missing-parent-summary",
      "--classification",
      "production-code",
    ]);
    expect(args.since).toBe("2026-05-15T01:00:00Z");
    expect(args.markMissingParentSummary).toBe(true);
    expect(args.classification).toBe("production-code");
  });
});

describe("detectMissingHours", () => {
  it("detects failed and missing hourly slots from D prime zero", () => {
    const missing = detectMissingHours(
      "2026-05-15T01:00:00Z",
      [
        {
          hour: "2026-05-15T01:12:00Z",
          runUrl: "https://example/run/1",
          conclusion: "success",
        },
        {
          hour: "2026-05-15T02:01:00Z",
          runUrl: "https://example/run/2",
          conclusion: "failure",
        },
      ],
      3,
    );
    expect(missing).toEqual([
      {
        hour: "2026-05-15T02:00:00.000Z",
        runUrl: "https://example/run/2",
        conclusion: "failure",
      },
      {
        hour: "2026-05-15T03:00:00.000Z",
        runUrl: "-",
        conclusion: "missing",
      },
    ]);
  });
});

describe("renderRootcauseMarkdown", () => {
  it("emits frontmatter + missing-hours table + production-code fix section", () => {
    const md = renderRootcauseMarkdown({
      since: "2026-05-15T01:00:00Z",
      parentSummaryMissing: true,
      classification: "production-code",
      missingHours: [
        {
          hour: "2026-05-14T00:00:00Z",
          runUrl: "https://example/run/1",
          conclusion: "failure",
        },
      ],
      productionCodeTargets: [".github/workflows/cf-audit-log-monitor.yml"],
    });
    expect(md).toMatch(/classification: production-code/);
    expect(md).toMatch(/parent_summary_json: missing/);
    expect(md).toMatch(/d_prime_zero: 2026-05-15T01:00:00Z/);
    expect(md).toMatch(/2026-05-14T00:00:00Z \| https:\/\/example\/run\/1/);
    expect(md).toMatch(/修正方針 \(production-code 分類\)/);
    expect(md).toMatch(/cf-audit-log-monitor\.yml/);
  });

  it("emits escalation section for unknown classification", () => {
    const md = renderRootcauseMarkdown({
      since: "2026-05-15T01:00:00Z",
      parentSummaryMissing: false,
      classification: "unknown",
      missingHours: [],
      escalationContact: "infra-team@example",
    });
    expect(md).toMatch(/parent_summary_json: present/);
    expect(md).toMatch(/escalation \(unknown 分類\)/);
    expect(md).toMatch(/infra-team@example/);
  });
});
