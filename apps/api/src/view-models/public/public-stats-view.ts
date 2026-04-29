// PublicStatsView 組成 (04a)
// 不変条件 #2 / #3 / #11 / #14 を適用。
// 集計値は repository から取得した数値 / 配列のみで構成し、PII を含めない。

import { z } from "zod";

import { PublicStatsViewZ } from "@ubm-hyogo/shared";

export type SyncStatusKind = "ok" | "running" | "failed" | "never";

export const PublicStatsResponseZ = PublicStatsViewZ.extend({
  meetingCountThisYear: z.number().int().nonnegative(),
  recentMeetings: z.array(
    z.object({
      sessionId: z.string(),
      title: z.string(),
      heldOn: z.string(),
    }),
  ),
  lastSync: z.object({
    schemaSync: z.enum(["ok", "running", "failed", "never"]),
    responseSync: z.enum(["ok", "running", "failed", "never"]),
    schemaSyncFinishedAt: z.string().nullable(),
    responseSyncFinishedAt: z.string().nullable(),
  }),
}).strict();

export type PublicStatsResponse = z.infer<typeof PublicStatsResponseZ>;

export interface StatsSource {
  memberCount: number;
  publicMemberCount: number;
  zoneBreakdown: Array<{ zone: string; count: number }>;
  membershipBreakdown: Array<{ type: string; count: number }>;
  meetingCountThisYear: number;
  recentMeetings: Array<{ sessionId: string; title: string; heldOn: string }>;
  lastSync: {
    schemaSync: SyncStatusKind;
    responseSync: SyncStatusKind;
    schemaSyncFinishedAt: string | null;
    responseSyncFinishedAt: string | null;
  };
  generatedAt: string;
}

export const toPublicStatsView = (src: StatsSource): PublicStatsResponse =>
  PublicStatsResponseZ.parse(src);
