import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MeetingAttendanceDrawer } from "../MeetingAttendanceDrawer";
import type { MeetingItem } from "../meetingStats";

afterEach(() => cleanup());

const meeting: MeetingItem = {
  sessionId: "sess-1",
  title: "第1回",
  heldOn: "2025-04-01",
  note: null,
  createdAt: "2025-01-01T00:00:00Z",
};

describe("MeetingAttendanceDrawer", () => {
  it("出席者一覧で氏名を主表示し memberId を補助表示する", () => {
    render(
      <MeetingAttendanceDrawer
        meeting={meeting}
        candidates={[{ memberId: "m_1", fullName: "山田 太郎" }]}
        attended={new Set(["m_1"])}
        onAddAttendance={vi.fn()}
        onBulkAddAttendance={vi.fn()}
        onRemoveAttendance={vi.fn()}
        onUpdateMeeting={vi.fn()}
        onSoftDelete={vi.fn()}
      />,
    );

    const attendee = screen.getByTestId("attendance-attendee-sess-1");
    expect(attendee.textContent).toContain("山田 太郎");
    expect(attendee.textContent).toContain("m_1");
  });

  it("候補にない出席者は memberId を表示する", () => {
    render(
      <MeetingAttendanceDrawer
        meeting={meeting}
        candidates={[]}
        attended={new Set(["m_unknown"])}
        onAddAttendance={vi.fn()}
        onBulkAddAttendance={vi.fn()}
        onRemoveAttendance={vi.fn()}
        onUpdateMeeting={vi.fn()}
        onSoftDelete={vi.fn()}
      />,
    );

    const attendee = screen.getByTestId("attendance-attendee-sess-1");
    expect(attendee.textContent).toContain("m_unknown");
  });
});
