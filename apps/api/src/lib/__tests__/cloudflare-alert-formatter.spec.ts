// UT-17 T5: Cloudflare → Slack 日本語 formatter unit tests
import { describe, it, expect } from "vitest";
import {
  classifyAlertMetric,
  formatCloudflareAlertToSlack,
} from "../cloudflare-alert-formatter";

describe("classifyAlertMetric", () => {
  it("FMT-01: Workers Daily Requests", () => {
    expect(
      classifyAlertMetric({ name: "Workers Daily Requests Approaching Limit" }),
    ).toBe("workers_daily_requests");
  });
  it("FMT-02: D1 Read Rows", () => {
    expect(classifyAlertMetric({ name: "D1 Read Rows Limit" })).toBe(
      "d1_read_rows",
    );
  });
  it("FMT-03: D1 Write Rows", () => {
    expect(classifyAlertMetric({ name: "D1 Write Rows Quota" })).toBe(
      "d1_write_rows",
    );
  });
  it("FMT-04: Pages Build", () => {
    expect(classifyAlertMetric({ name: "Pages Build Quota" })).toBe(
      "pages_build",
    );
  });
  it("FMT-05: R2 Class A", () => {
    expect(classifyAlertMetric({ name: "R2 Class A Operations" })).toBe(
      "r2_class_a",
    );
  });
  it("FMT-06: unknown payload", () => {
    expect(classifyAlertMetric({ name: "Some Other Notification" })).toBe(
      "unknown",
    );
  });
});

describe("formatCloudflareAlertToSlack", () => {
  it("FMT-01: Workers payload を Block Kit に整形（日本語）", () => {
    const msg = formatCloudflareAlertToSlack({
      name: "Workers Daily Requests Approaching Limit",
      data: { current: 80000, threshold: 100000 },
      severity: "warning",
    });
    expect(msg.text).toContain("Workers リクエスト");
    expect(msg.text).toContain("[WARNING]");
    expect(JSON.stringify(msg.blocks)).toContain("Workers リクエスト");
    expect(JSON.stringify(msg.blocks)).toContain("閾値");
    expect(JSON.stringify(msg.blocks)).toContain("残量");
  });

  it("FMT-CRITICAL: 95% 以上は CRITICAL 扱い", () => {
    const msg = formatCloudflareAlertToSlack({
      name: "D1 Read Rows Limit",
      data: { current: 96, threshold: 100 },
    });
    expect(msg.text).toContain("[CRITICAL]");
  });

  it("FMT-06: unknown は元 name を text に保持", () => {
    const msg = formatCloudflareAlertToSlack({ name: "Mystery Alert" });
    expect(msg.text).toContain("Mystery Alert");
    expect(JSON.stringify(msg.blocks)).toContain("Mystery Alert");
  });

  it("FMT-07: dashboardUrl / runbookUrl 指定でリンク section を追加", () => {
    const msg = formatCloudflareAlertToSlack(
      { name: "Workers Daily Requests" },
      {
        dashboardUrl: "https://dash.cloudflare.com/x",
        runbookUrl: "https://example.test/runbook",
      },
    );
    const json = JSON.stringify(msg.blocks);
    expect(json).toContain("dash.cloudflare.com");
    expect(json).toContain("runbook");
  });

  it("FMT-08: ja-JP の数値整形（カンマ区切り）", () => {
    const msg = formatCloudflareAlertToSlack({
      name: "Workers Daily Requests",
      data: { current: 1234567, threshold: 2000000 },
    });
    expect(JSON.stringify(msg.blocks)).toContain("1,234,567");
    expect(JSON.stringify(msg.blocks)).toContain("2,000,000");
  });
});
