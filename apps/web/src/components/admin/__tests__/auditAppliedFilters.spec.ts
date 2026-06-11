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
      { key: "action", label: "action", value: "admin.member.tag_assigned" },
      { key: "targetType", label: "target type", value: "member" },
      { key: "period", label: "期間", value: "2026-06-01〜2026-06-09" },
      { key: "limit", label: "limit", value: "50" },
    ]);
  });

  it("formats one-sided periods and uses fallback limit when the API omits limit", () => {
    expect(toAppliedFilterChips({ from: "not-a-date-value" }, "50")).toEqual([
      { key: "period", label: "期間", value: "not-a-date 以降" },
      { key: "limit", label: "limit", value: "50" },
    ]);
    expect(toAppliedFilterChips({ to: "2026-06-09T23:59:59.000Z" }, "100")).toEqual([
      { key: "period", label: "期間", value: "2026-06-09 まで" },
      { key: "limit", label: "limit", value: "100" },
    ]);
  });

  it("returns an empty list when no filters were applied", () => {
    expect(toAppliedFilterChips(undefined, "50")).toEqual([]);
    expect(toAppliedFilterChips({}, "")).toEqual([]);
  });
});
