import { describe, expect, it } from "vitest";
import { attendanceFollowLevel } from "../lib/attendance-follow-level";

describe("attendanceFollowLevel", () => {
  it.each([
    [-1, "none"],
    [0, "none"],
    [1, "warn"],
    [5, "warn"],
  ] as const)("maps %i follow-up members to %s", (count, expected) => {
    expect(attendanceFollowLevel(count)).toBe(expected);
  });
});
