import { describe, it, expect } from "vitest";
import {
  formatRate,
  formatDelta,
  presetToPeriod,
  ZONE_LABEL,
  ZONE_HELP,
  SELECTABLE_ZONES,
} from "../lib/format-attendance";

describe("format-attendance", () => {
  it("formatRate clamps and percent", () => {
    expect(formatRate(0.1234)).toBe("12.3%");
    expect(formatRate(1.5)).toBe("100.0%");
    expect(formatRate(-0.2)).toBe("0.0%");
    expect(formatRate(Number.NaN)).toBe("—");
  });

  it("formatDelta shows arrow", () => {
    expect(formatDelta(0.6, 0.5)).toBe("↑10.0ポイント");
    expect(formatDelta(0.4, 0.5)).toBe("↓10.0ポイント");
    expect(formatDelta(0.5, 0.5)).toBe("→0.0ポイント");
    expect(formatDelta(0.5, null)).toBe("—");
  });

  it("presetToPeriod 'all' returns nulls", () => {
    expect(presetToPeriod("all")).toEqual({ periodFrom: null, periodTo: null });
  });

  it("presetToPeriod '3m' returns ISO range with span", () => {
    const now = new Date("2026-05-26T00:00:00Z");
    const r = presetToPeriod("3m", now);
    expect(r.periodTo).toBe("2026-05-26");
    expect(r.periodFrom).toBe("2026-02-26");
  });

  it("ZONE_LABEL covers known zones", () => {
    expect(ZONE_LABEL.zone_0).toBe("0 回（未出席）");
    expect(ZONE_LABEL.zone_1_9).toBe("1〜9 回");
    expect(ZONE_LABEL.zone_10_99).toBe("10〜99 回");
    expect(ZONE_LABEL.zone_100_plus).toBe("100 回以上");
    expect(ZONE_LABEL.unknown).toBe("分類不能");
    expect(SELECTABLE_ZONES).toEqual([
      "zone_0",
      "zone_1_9",
      "zone_10_99",
      "zone_100_plus",
    ]);
    expect(ZONE_HELP).toContain("100 回以上");
    expect(ZONE_HELP).toContain("各メンバーがこれまでに参加した合計回数");
  });
});
