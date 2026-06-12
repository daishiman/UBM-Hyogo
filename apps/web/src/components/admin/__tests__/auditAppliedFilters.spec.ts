import { describe, expect, it } from "vitest";
import { toAppliedFilterChips } from "../auditAppliedFilters";

describe("toAppliedFilterChips", () => {
  it("returns visible chips for applied audit filters and skips empty values", () => {
    expect(
      toAppliedFilterChips({
        action: "admin.member.tag_assigned",
        actorEmail: "",
        targetType: "member",
        from: "2026-06-01T00:00:00.000Z",
        to: "2026-06-09T23:59:59.000Z",
        limit: 50,
        cursor: "internal-cursor",
      }, "25"),
    ).toEqual([
      { key: "action", label: "操作の種類", value: "タグを割り当て" },
      { key: "targetType", label: "対象の種類", value: "会員" },
      { key: "period", label: "期間", value: "2026-06-01〜2026-06-09" },
      { key: "limit", label: "表示件数", value: "50" },
    ]);
  });

  it("formats one-sided periods and uses fallback limit when the API omits limit", () => {
    expect(toAppliedFilterChips({ from: "not-a-date-value" }, "50")).toEqual([
      { key: "period", label: "期間", value: "not-a-date 以降" },
      { key: "limit", label: "表示件数", value: "50" },
    ]);
    expect(toAppliedFilterChips({ to: "2026-06-09T23:59:59.000Z" }, "100")).toEqual([
      { key: "period", label: "期間", value: "2026-06-09 まで" },
      { key: "limit", label: "表示件数", value: "100" },
    ]);
  });

  it("uses Japanese chip labels without exposing common English keys", () => {
    const chips = toAppliedFilterChips({
      action: "attendance.add",
      actorEmail: "admin@example.com",
      targetType: "meeting",
      targetId: "meeting_123",
      batchId: "batch-1",
    }, "50");

    expect(chips).toContainEqual({ key: "action", label: "操作の種類", value: "出席を追加" });
    expect(chips).toContainEqual({ key: "actorEmail", label: "実行者（メール）", value: "admin@example.com" });
    expect(chips).toContainEqual({ key: "targetType", label: "対象の種類", value: "開催日" });
    expect(chips).toContainEqual({ key: "batchId", label: "一括処理ID", value: "batch-1" });
    expect(chips.map((chip) => chip.label)).not.toEqual(
      expect.arrayContaining(["action", "actor", "target type", "batchId", "limit"]),
    );
  });

  it("returns an empty list when no filters were applied", () => {
    expect(toAppliedFilterChips(undefined, "50")).toEqual([]);
    expect(toAppliedFilterChips({}, "")).toEqual([]);
  });
});
