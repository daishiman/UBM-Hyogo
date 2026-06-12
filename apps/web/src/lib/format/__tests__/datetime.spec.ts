// admin-members-timestamp-jst-and-identity-label-clarity (T1):
// formatJstDateTimeWithSeconds の JST 整形 / fail-soft を検証する。
import { describe, it, expect } from "vitest";
import { formatJstDateTime, formatJstDateTimeWithSeconds } from "../datetime";

describe("formatJstDateTimeWithSeconds", () => {
  it("AC-1/AC-2: UTC ISO を JST の年月日漢字・秒まで整形する", () => {
    // UTC 10:34:19 → JST 19:34:19
    expect(formatJstDateTimeWithSeconds("2026-06-09T10:34:19.996603Z")).toBe(
      "2026年6月9日 19:34:19",
    );
  });

  it("AC-1: 月日のゼロ埋めは外し、時分秒は 2 桁ゼロ埋めを維持する", () => {
    // UTC 00:00:09 → JST 09:00:09（1月3日）
    expect(formatJstDateTimeWithSeconds("2026-01-03T00:00:09.000Z")).toBe(
      "2026年1月3日 09:00:09",
    );
  });

  it("日付境界をまたぐ UTC→JST 変換が正しい", () => {
    // UTC 2026-06-09 23:30:00 → JST 2026-06-10 08:30:00
    expect(formatJstDateTimeWithSeconds("2026-06-09T23:30:00.000Z")).toBe(
      "2026年6月10日 08:30:00",
    );
  });

  it("AC-2: 不正値は元入力をそのまま返す（fail-soft・例外を投げない）", () => {
    expect(formatJstDateTimeWithSeconds("not-a-date")).toBe("not-a-date");
  });

  it("AC-2: 空文字は空文字を返す", () => {
    expect(formatJstDateTimeWithSeconds("")).toBe("");
  });

  it("既存 formatJstDateTime は分まで（秒なし）で変更しない", () => {
    expect(formatJstDateTime("2026-06-09T10:34:19.000Z")).toBe("2026/06/09 19:34");
  });
});
