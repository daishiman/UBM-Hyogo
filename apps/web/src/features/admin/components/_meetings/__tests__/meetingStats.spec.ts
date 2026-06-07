import { describe, expect, it } from "vitest";
import { attendanceLevel, computeMeetingStats, type MeetingItem } from "../meetingStats";

const mk = (
  sessionId: string,
  heldOn: string,
  attendees: number,
): MeetingItem => ({
  sessionId,
  title: `t-${sessionId}`,
  heldOn,
  note: null,
  createdAt: "2025-01-01T00:00:00Z",
  attendance: Array.from({ length: attendees }, (_, i) => ({ memberId: `m-${i}` })),
});

describe("computeMeetingStats", () => {
  it("0 件で avg=0 / recentHeldOn=null", () => {
    const s = computeMeetingStats([]);
    expect(s).toEqual({
      totalMeetings: 0,
      recentHeldOn: null,
      totalAttendees: 0,
      avgAttendees: 0,
    });
  });

  it("複数件で max date / 合計 / 平均小数1桁丸め", () => {
    const items = [mk("a", "2025-01-10", 2), mk("b", "2025-03-05", 3), mk("c", "2024-12-30", 1)];
    const s = computeMeetingStats(items);
    expect(s.totalMeetings).toBe(3);
    expect(s.recentHeldOn).toBe("2025-03-05");
    expect(s.totalAttendees).toBe(6);
    expect(s.avgAttendees).toBe(2);
  });

  it("平均が小数 1 桁で丸められる", () => {
    const items = [mk("a", "2025-01-01", 1), mk("b", "2025-01-02", 2), mk("c", "2025-01-03", 2)];
    const s = computeMeetingStats(items);
    // 5/3 = 1.6666 → 1.7
    expect(s.avgAttendees).toBe(1.7);
  });

  it("attendance 未指定でも 0 として扱う", () => {
    const items: MeetingItem[] = [
      {
        sessionId: "x",
        title: "t",
        heldOn: "2025-01-01",
        note: null,
        createdAt: "2025-01-01T00:00:00Z",
      },
    ];
    const s = computeMeetingStats(items);
    expect(s.totalAttendees).toBe(0);
    expect(s.avgAttendees).toBe(0);
  });
});

describe("attendanceLevel", () => {
  it.each([
    [0, "none"],
    [-3, "none"],
    [Number.NaN, "none"],
    [1, "normal"],
    [9, "normal"],
    [10, "high"],
    [25, "high"],
  ] as const)("%s 名を %s に分類する", (count, expected) => {
    expect(attendanceLevel(count)).toBe(expected);
  });
});
