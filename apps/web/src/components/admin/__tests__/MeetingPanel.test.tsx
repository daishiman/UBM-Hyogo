// 06c: 不変条件 #15 — filterCandidates が isDeleted=true を除外
import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { MeetingPanel, filterCandidates } from "../MeetingPanel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("../../../lib/admin/api", () => ({
  createMeeting: vi.fn(),
  addAttendance: vi.fn(),
  removeAttendance: vi.fn(),
}));

describe("MeetingPanel.filterCandidates", () => {
  it("isDeleted=true を候補から除外する", () => {
    const input = [
      { memberId: "a", isDeleted: false },
      { memberId: "b", isDeleted: true },
      { memberId: "c" },
    ];
    const out = filterCandidates(input);
    expect(out.map((m) => m.memberId)).toEqual(["a", "c"]);
  });

  it("既存 attendance を初期状態から disabled にする", async () => {
    render(
      <MeetingPanel
        meetings={{
          total: 1,
          items: [
            {
              sessionId: "s1",
              title: "例会",
              heldOn: "2026-04-29",
              note: null,
              createdAt: "2026-04-29T00:00:00Z",
              attendance: [{ memberId: "m1" }],
            },
          ],
        }}
        candidates={[
          { memberId: "m1", fullName: "既存 出席" },
          { memberId: "m2", fullName: "未 出席" },
        ]}
      />,
    );

    fireEvent.change(screen.getByLabelText("会員を選択"), { target: { value: "m1" } });

    expect((screen.getByRole("option", { name: /既存 出席/ }) as HTMLOptionElement).disabled).toBe(true);
    expect((screen.getByTestId("add-attendance-s1") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("m1")).toBeTruthy();
  });
});
