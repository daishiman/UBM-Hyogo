import { describe, expect, it } from "vitest";
import { classify, isInCidrList } from "../severity-classifier.ts";
import type { AuditLogEvent, Baseline } from "../types.ts";

const baseline: Baseline = {
  successPerHourP95: 5,
  failurePerHourP95: 1,
  offHoursRatio: 0.1,
  computedAt: "2026-05-06T00:00:00Z",
  windowDays: 7,
};

const githubIpRanges = ["140.82.112.0/20", "192.30.252.0/22"];

function ev(overrides: Partial<AuditLogEvent>): AuditLogEvent {
  return {
    id: "id-1",
    when: "2026-05-06T05:00:00Z",
    actor: { email: "ci@example.com", ip: "140.82.115.10" },
    action: { type: "token.read", result: "success" },
    ...overrides,
  };
}

const ctxBase = {
  githubIpRanges,
  businessHoursJst: { start: 9, end: 19 },
  recentFailuresInHour: 0,
  rotationWindowMs: null,
};

describe("severity-classifier.classify", () => {
  it("C-01 normal success from GitHub IP returns null", () => {
    expect(classify(ev({}), baseline, ctxBase)).toBeNull();
  });

  it("C-02 foreign-ip success returns HIGH", () => {
    const r = classify(
      ev({ actor: { email: "x@y", ip: "203.0.113.5" } }),
      baseline,
      ctxBase,
    );
    expect(r).not.toBeNull();
    expect(r!.severity).toBe("HIGH");
    expect(r!.reason).toContain("203.0.113.5");
  });

  it("C-03 403 burst returns MEDIUM", () => {
    const r = classify(
      ev({ action: { type: "x", result: "failure", result_code: 403 } }),
      baseline,
      { ...ctxBase, recentFailuresInHour: 10 },
    );
    expect(r?.severity).toBe("MEDIUM");
  });

  it("C-04 off-hours JST 03:00 success returns LOW", () => {
    const r = classify(
      ev({ when: "2026-05-06T18:00:00Z" }),
      baseline,
      ctxBase,
    );
    expect(r?.severity).toBe("LOW");
    expect(r?.reason).toContain("JST 3:00");
  });

  it("C-05 baseline=null returns null even for foreign-ip", () => {
    const r = classify(
      ev({ actor: { ip: "203.0.113.5" } }),
      null,
      ctxBase,
    );
    expect(r).toBeNull();
  });

  it("C-06 rotation window suppresses event", () => {
    const t = Date.parse("2026-05-06T05:00:00Z");
    const r = classify(
      ev({ actor: { ip: "203.0.113.5" } }),
      baseline,
      { ...ctxBase, rotationWindowMs: { start: t - 1000, end: t + 1000 } },
    );
    expect(r).toBeNull();
  });

  it("C-07 success without ip skips HIGH path", () => {
    const r = classify(
      ev({ actor: { email: "x@y" } }),
      baseline,
      ctxBase,
    );
    // 業務時間内 (UTC 05 → JST 14) なので LOW にも該当せず null
    expect(r).toBeNull();
  });

  it("C-08 403 below threshold returns null", () => {
    const r = classify(
      ev({ action: { type: "x", result: "failure", result_code: 403 } }),
      baseline,
      { ...ctxBase, recentFailuresInHour: 1 },
    );
    expect(r).toBeNull();
  });

  it("C-09 boundary JST 09:00 / 19:00 are treated according to SSOT", () => {
    // JST 09:00 = UTC 00:00
    expect(classify(ev({ when: "2026-05-06T00:00:00Z" }), baseline, ctxBase))
      .toBeNull();
    // JST 18:59 -> still in-hours
    expect(classify(ev({ when: "2026-05-06T09:59:00Z" }), baseline, ctxBase))
      .toBeNull();
    // JST 19:00 -> off-hours
    const r = classify(ev({ when: "2026-05-06T10:00:00Z" }), baseline, ctxBase);
    expect(r?.severity).toBe("LOW");
  });

  it("C-10 foreign-ip without UA still HIGH", () => {
    const r = classify(
      ev({ actor: { email: "x@y", ip: "8.8.8.8" } }),
      baseline,
      ctxBase,
    );
    expect(r?.severity).toBe("HIGH");
  });
});

describe("isInCidrList", () => {
  it("matches IPv4 inside /20", () => {
    expect(isInCidrList("140.82.112.5", ["140.82.112.0/20"])).toBe(true);
  });
  it("rejects IPv4 outside /20", () => {
    expect(isInCidrList("140.82.128.5", ["140.82.112.0/20"])).toBe(false);
  });
  it("handles /32 exact", () => {
    expect(isInCidrList("1.2.3.4", ["1.2.3.4/32"])).toBe(true);
    expect(isInCidrList("1.2.3.5", ["1.2.3.4/32"])).toBe(false);
  });
  it("handles /0 wildcard", () => {
    expect(isInCidrList("9.9.9.9", ["0.0.0.0/0"])).toBe(true);
  });
  it("handles invalid input", () => {
    expect(isInCidrList("not-an-ip", ["1.2.3.4/32"])).toBe(false);
  });
  it("handles ipv6 /64", () => {
    expect(isInCidrList("2001:db8::1", ["2001:db8::/32"])).toBe(true);
    expect(isInCidrList("2001:db9::1", ["2001:db8::/32"])).toBe(false);
  });
});
