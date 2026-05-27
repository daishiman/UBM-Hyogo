import { z } from "zod";

import {
  AttendanceOverviewZ,
  SessionAttendanceRowZ,
  MemberAttendanceRankingZ,
} from "./viewmodel";

export const AttendanceZoneZ = z.enum(["0→1", "1→10", "10→100", "unknown"]);
export type AttendanceZone = z.infer<typeof AttendanceZoneZ>;

export const AttendanceFilterEchoZ = z
  .object({
    periodFrom: z.string().nullable(),
    periodTo: z.string().nullable(),
    zoneFilter: z.array(AttendanceZoneZ).nullable(),
  })
  .strict();

export const AttendanceOverviewExtZ = AttendanceOverviewZ.extend({
  filter: AttendanceFilterEchoZ,
  previousPeriodRate: z.number().nullable(),
}).strict();

export const AttendanceSessionRowExtZ = SessionAttendanceRowZ.extend({
  zone: AttendanceZoneZ.optional(),
}).strict();

export const AttendanceMemberRankingExtZ = MemberAttendanceRankingZ.extend({
  zone: AttendanceZoneZ.optional(),
  lastAttendedAt: z.string().nullable().optional(),
  consecutiveStreak: z.number().int().nonnegative().optional(),
}).strict();

export const AttendanceTrendBucketZ = z
  .object({
    period: z.string(),
    attendeeCount: z.number().int().nonnegative(),
    sessionCount: z.number().int().nonnegative(),
    uniqueMemberCount: z.number().int().nonnegative(),
  })
  .strict();

export const AttendanceTrendZ = z
  .object({
    granularity: z.literal("month"),
    buckets: z.array(AttendanceTrendBucketZ),
    filter: AttendanceFilterEchoZ,
  })
  .strict();

export const AttendanceZoneDistributionRowZ = z
  .object({
    zone: AttendanceZoneZ,
    attendeeCount: z.number().int().nonnegative(),
    rate: z.number().min(0).max(1),
  })
  .strict();

export const AttendanceZoneDistributionZ = z
  .object({
    rows: z.array(AttendanceZoneDistributionRowZ),
    filter: AttendanceFilterEchoZ,
  })
  .strict();

const AttendanceMemberRefZ = z
  .object({
    memberId: z.string().min(1),
    displayName: z.string(),
    zone: AttendanceZoneZ,
  })
  .strict();

export const AttendanceSessionDetailZ = z
  .object({
    sessionId: z.string().min(1),
    title: z.string(),
    heldOn: z.string(),
    attendees: z.array(AttendanceMemberRefZ),
    absentees: z.array(AttendanceMemberRefZ),
  })
  .strict();

export const AttendanceAbsenteeZ = z
  .object({
    memberId: z.string().min(1),
    displayName: z.string(),
    zone: AttendanceZoneZ,
    lastAttendedAt: z.string().nullable(),
    missedCount: z.number().int().nonnegative(),
  })
  .strict();

export const AttendanceAbsenteeListZ = z
  .object({
    rows: z.array(AttendanceAbsenteeZ),
    lastN: z.number().int().positive(),
    filter: AttendanceFilterEchoZ,
  })
  .strict();

export type AttendanceFilterEcho = z.infer<typeof AttendanceFilterEchoZ>;
export type AttendanceOverviewExt = z.infer<typeof AttendanceOverviewExtZ>;
export type AttendanceSessionRowExt = z.infer<typeof AttendanceSessionRowExtZ>;
export type AttendanceMemberRankingExt = z.infer<typeof AttendanceMemberRankingExtZ>;
export type AttendanceTrendBucket = z.infer<typeof AttendanceTrendBucketZ>;
export type AttendanceTrend = z.infer<typeof AttendanceTrendZ>;
export type AttendanceZoneDistributionRow = z.infer<typeof AttendanceZoneDistributionRowZ>;
export type AttendanceZoneDistribution = z.infer<typeof AttendanceZoneDistributionZ>;
export type AttendanceMemberRef = z.infer<typeof AttendanceMemberRefZ>;
export type AttendanceSessionDetail = z.infer<typeof AttendanceSessionDetailZ>;
export type AttendanceAbsentee = z.infer<typeof AttendanceAbsenteeZ>;
export type AttendanceAbsenteeList = z.infer<typeof AttendanceAbsenteeListZ>;
