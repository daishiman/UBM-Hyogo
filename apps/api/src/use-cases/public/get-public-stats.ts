// GET /public/stats use-case (04a)
// 不変条件 #2 / #11 — 公開フィルタを通った member のみ集計。
// 不変条件 #14 — sync_jobs は kind whitelist でのみ参照 (R-7)。

import type { DbCtx } from "../../repository/_shared/db";
import { findLatest } from "../../repository/syncJobs";
import { countMeetingsInYear, listRecentMeetings } from "../../repository/meetings";
import {
  aggregatePublicMemberships,
  aggregatePublicZones,
  countAllMembers,
  countAllPublicMembers,
} from "../../repository/publicMembers";
import {
  toPublicStatsView,
  type PublicStatsResponse,
  type SyncStatusKind,
} from "../../view-models/public/public-stats-view";

const RECENT_MEETING_LIMIT = 5;

const mapJobStatus = (
  job: { status: "running" | "succeeded" | "failed" } | null,
): SyncStatusKind => {
  if (!job) return "never";
  if (job.status === "running") return "running";
  if (job.status === "succeeded") return "ok";
  return "failed";
};

export interface GetPublicStatsDeps {
  ctx: DbCtx;
}

export const getPublicStats = async (
  deps: GetPublicStatsDeps,
): Promise<PublicStatsResponse> => {
  const { ctx } = deps;

  const [
    memberCount,
    publicMemberCount,
    zones,
    memberships,
    meetingCountThisYear,
    recentMeetings,
    schemaJob,
    responseJob,
  ] = await Promise.all([
    countAllMembers(ctx),
    countAllPublicMembers(ctx),
    aggregatePublicZones(ctx),
    aggregatePublicMemberships(ctx),
    countMeetingsInYear(ctx, new Date().getUTCFullYear()),
    listRecentMeetings(ctx, RECENT_MEETING_LIMIT),
    findLatest(ctx, "schema_sync"),
    findLatest(ctx, "response_sync"),
  ]);

  return toPublicStatsView({
    memberCount,
    publicMemberCount,
    zoneBreakdown: zones,
    membershipBreakdown: memberships,
    meetingCountThisYear,
    recentMeetings: recentMeetings.map((m) => ({
      sessionId: m.sessionId,
      title: m.title,
      heldOn: m.heldOn,
    })),
    lastSync: {
      schemaSync: mapJobStatus(schemaJob),
      responseSync: mapJobStatus(responseJob),
      schemaSyncFinishedAt: schemaJob?.finishedAt ?? null,
      responseSyncFinishedAt: responseJob?.finishedAt ?? null,
    },
    generatedAt: new Date().toISOString(),
  });
};
