import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

afterEach(() => cleanup());
import { MeetingTimeline } from "../MeetingTimeline";
import type { MeetingItem } from "../meetingStats";

const item: MeetingItem = {
  sessionId: "sess-1",
  title: "第1回",
  heldOn: "2025-04-01",
  note: null,
  createdAt: "2025-01-01T00:00:00Z",
};

describe("MeetingTimeline", () => {
  it("0 件で AdminEmptyState を表示", () => {
    render(<MeetingTimeline items={[]} selectedId={null} onSelect={() => {}} />);
    expect(screen.getByTestId("admin-empty-state")).toBeTruthy();
  });

  it("行 click で onSelect が発火する", () => {
    const onSelect = vi.fn();
    render(<MeetingTimeline items={[item]} selectedId={null} onSelect={onSelect} />);
    const row = screen.getByTestId("meeting-row-sess-1");
    fireEvent.click(row.querySelector("button")!);
    expect(onSelect).toHaveBeenCalledWith("sess-1");
  });

  it("attendance-list-session-<id> testid が維持される", () => {
    render(<MeetingTimeline items={[item]} selectedId={null} onSelect={() => {}} />);
    expect(screen.getByTestId("attendance-list-session-sess-1")).toBeTruthy();
  });
});
