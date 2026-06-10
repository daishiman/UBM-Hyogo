export type AttendanceFollowLevel = "none" | "warn";

export function attendanceFollowLevel(count: number): AttendanceFollowLevel {
  return count <= 0 ? "none" : "warn";
}
