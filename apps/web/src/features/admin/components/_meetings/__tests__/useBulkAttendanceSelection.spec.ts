import { afterEach, describe, expect, it } from "vitest";
import { cleanup, renderHook, act } from "@testing-library/react";
import { useBulkAttendanceSelection } from "../useBulkAttendanceSelection";

afterEach(() => cleanup());

const candidates = [
  { memberId: "m-1", fullName: "山田 太郎" },
  { memberId: "m-2", fullName: "佐藤 花子" },
  { memberId: "m-3", fullName: "鈴木 次郎" },
];

describe("useBulkAttendanceSelection", () => {
  it("出席済みを候補から除外し、検索と全選択を適用する", () => {
    const { result } = renderHook(() =>
      useBulkAttendanceSelection(candidates, new Set(["m-2"])),
    );

    expect(result.current.selectableCandidates.map((c) => c.memberId)).toEqual([
      "m-1",
      "m-3",
    ]);

    act(() => result.current.setQuery("鈴木"));
    expect(result.current.selectableCandidates.map((c) => c.memberId)).toEqual([
      "m-3",
    ]);

    act(() => result.current.selectAllFiltered());
    expect([...result.current.selectedIds]).toEqual(["m-3"]);
  });

  it("attended 変化で stale な選択を取り除く", () => {
    const attended = new Set<string>();
    const { result, rerender } = renderHook(
      ({ nextAttended }) => useBulkAttendanceSelection(candidates, nextAttended),
      { initialProps: { nextAttended: attended } },
    );

    act(() => result.current.toggle("m-1"));
    expect(result.current.selectedIds.has("m-1")).toBe(true);

    rerender({ nextAttended: new Set(["m-1"]) });

    expect(result.current.selectedIds.has("m-1")).toBe(false);
  });
});
