export interface MeetingItem {
  sessionId: string;
  title: string;
  heldOn: string;
  note: string | null;
  createdAt: string;
  attendance?: ReadonlyArray<{ memberId: string; assignedAt?: string; assignedBy?: string }>;
}

export interface MeetingStats {
  readonly totalMeetings: number;
  readonly recentHeldOn: string | null;
  readonly totalAttendees: number;
  readonly avgAttendees: number;
}

export type AttendanceLevel = "none" | "normal" | "high";

export const ATTENDANCE_LEVEL_THRESHOLDS = {
  high: 10,
} as const;

export function attendanceLevel(count: number): AttendanceLevel {
  if (!Number.isFinite(count) || count <= 0) {
    return "none";
  }
  if (count >= ATTENDANCE_LEVEL_THRESHOLDS.high) {
    return "high";
  }
  return "normal";
}

export function computeMeetingStats(items: ReadonlyArray<MeetingItem>): MeetingStats {
  const totalMeetings = items.length;
  const recentHeldOn = items.reduce<string | null>(
    (max, m) => (m.heldOn > (max ?? "") ? m.heldOn : max),
    null,
  );
  const totalAttendees = items.reduce(
    (sum, m) => sum + (m.attendance?.length ?? 0),
    0,
  );
  const avgAttendees =
    totalMeetings === 0 ? 0 : Math.round((totalAttendees / totalMeetings) * 10) / 10;
  return { totalMeetings, recentHeldOn, totalAttendees, avgAttendees };
}
