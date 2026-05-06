import { describe, expect, it, vi } from "vitest";
import {
  buildFinding,
  computeDedupeKey,
  labelsFor,
  reportFinding,
  renderBody,
  type IssueClient,
} from "../issue-reporter.ts";
import type { AuditLogEvent } from "../types.ts";

function ev(): AuditLogEvent {
  return {
    id: "id-1",
    when: "2026-05-06T05:00:00Z",
    actor: { email: "ci@example.com", ip: "203.0.113.5" },
    action: { type: "token.read", result: "success" },
  };
}

describe("issue-reporter", () => {
  it("IR-01 creates issue when not yet reported", async () => {
    const finding = buildFinding(ev(), {
      severity: "HIGH",
      reason: "foreign-ip",
    });
    const client: IssueClient = {
      create: vi.fn().mockResolvedValue({ number: 42 }),
    };
    const recordReported = vi.fn().mockResolvedValue(undefined);
    const r = await reportFinding(finding, {
      client,
      owner: "o",
      repo: "r",
      isAlreadyReported: async () => null,
      recordReported,
    });
    expect(r).toEqual({ issueNumber: 42, deduped: false, dryRun: false });
    expect(client.create).toHaveBeenCalledTimes(1);
    expect(recordReported).toHaveBeenCalledWith(finding.dedupeKey, 42);
  });

  it("IR-02 dedupe returns existing issue without creating", async () => {
    const finding = buildFinding(ev(), {
      severity: "HIGH",
      reason: "foreign-ip",
    });
    const client: IssueClient = { create: vi.fn() };
    const r = await reportFinding(finding, {
      client,
      owner: "o",
      repo: "r",
      isAlreadyReported: async () => 99,
      recordReported: async () => undefined,
    });
    expect(r).toEqual({ issueNumber: 99, deduped: true, dryRun: false });
    expect(client.create).not.toHaveBeenCalled();
  });

  it("IR-03 dry-run writes to stdout and skips create", async () => {
    const finding = buildFinding(ev(), {
      severity: "MEDIUM",
      reason: "burst",
    });
    const lines: string[] = [];
    const client: IssueClient = { create: vi.fn() };
    const r = await reportFinding(finding, {
      client,
      owner: "o",
      repo: "r",
      isAlreadyReported: async () => null,
      recordReported: async () => undefined,
      dryRun: true,
      stdout: { write: (s) => { lines.push(s); } },
    });
    expect(r.dryRun).toBe(true);
    expect(client.create).not.toHaveBeenCalled();
    expect(lines.join("")).toMatch(/\[DRY-RUN\] would create issue/);
    expect(lines.join("")).toMatch(/\[CF-AUDIT\]\[MEDIUM\]/);
  });

  it("IR-04 labels are severity-specific", () => {
    expect(labelsFor("HIGH")).toEqual(["priority:high", "type:security", "cf-audit", "bot:cf-audit-log-monitor"]);
    expect(labelsFor("MEDIUM")).toEqual(["priority:medium", "type:security", "cf-audit", "bot:cf-audit-log-monitor"]);
    expect(labelsFor("LOW")).toEqual(["priority:low", "type:security", "cf-audit", "bot:cf-audit-log-monitor"]);
  });

  it("IR-05 title prefix differs by severity", () => {
    expect(buildFinding(ev(), { severity: "HIGH", reason: "x" }).titlePrefix)
      .toBe("[CF-AUDIT][HIGH] ");
    expect(buildFinding(ev(), { severity: "MEDIUM", reason: "x" }).titlePrefix)
      .toBe("[CF-AUDIT][MEDIUM] ");
    expect(buildFinding(ev(), { severity: "LOW", reason: "x" }).titlePrefix)
      .toBe("[CF-AUDIT][LOW] ");
  });

  it("dedupe hash differs across MEDIUM vs HIGH bucket granularity", () => {
    const e1 = ev();
    const e2: AuditLogEvent = { ...ev(), when: "2026-05-06T05:30:00Z" };
    // HIGH = 日 bucket → 同日なので同じ
    expect(computeDedupeKey(e1, "HIGH")).toBe(computeDedupeKey(e2, "HIGH"));
    // MEDIUM = 時 bucket → 同じ 05 時なので同じ
    expect(computeDedupeKey(e1, "MEDIUM")).toBe(computeDedupeKey(e2, "MEDIUM"));
    // 別時間
    const e3: AuditLogEvent = { ...ev(), when: "2026-05-06T06:30:00Z" };
    expect(computeDedupeKey(e1, "MEDIUM")).not.toBe(computeDedupeKey(e3, "MEDIUM"));
  });

  it("redacts full IP, user agent, and raw event JSON from issue body", () => {
    const finding = buildFinding(
      {
        ...ev(),
        actor: {
          email: "ci@example.com",
          ip: "203.0.113.5",
          user_agent: "secret-user-agent/1.0",
        },
        resource: { type: "api_token", id: "token-resource-abcdef123456" },
      },
      { severity: "HIGH", reason: "foreign-ip" },
    );
    const body = renderBody(finding);
    expect(body).toContain("203.0.x.x");
    expect(body).not.toContain("203.0.113.5");
    expect(body).not.toContain("secret-user-agent/1.0");
    expect(body).not.toContain('"user_agent"');
    expect(body).not.toContain('"raw"');
    expect(body).not.toContain("token-resource-abcdef123456");
  });
});
