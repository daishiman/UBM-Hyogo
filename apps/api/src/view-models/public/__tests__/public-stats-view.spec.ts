import { describe, expect, it } from "vitest";

import { toPublicStatsView } from "../public-stats-view";

describe("toPublicStatsView", () => {
  it("returns parsed view for valid source", () => {
    const result = toPublicStatsView({
      memberCount: 30,
      publicMemberCount: 20,
      zoneBreakdown: [{ zone: "0_to_1", count: 10 }],
      membershipBreakdown: [{ type: "member", count: 25 }],
      meetingCountThisYear: 4,
      recentMeetings: [
        { sessionId: "s-1", title: "4月会", heldOn: "2026-04-15" },
      ],
      lastSync: {
        schemaSync: "ok",
        responseSync: "ok",
        schemaSyncFinishedAt: "2026-04-29T03:00:00+09:00",
        responseSyncFinishedAt: "2026-04-29T03:15:00+09:00",
      },
      generatedAt: "2026-04-29T03:20:00+09:00",
    });
    expect(result.memberCount).toBe(30);
    expect(result.lastSync.schemaSync).toBe("ok");
    expect(result.recentMeetings).toHaveLength(1);
  });

  it.each(["ok", "running", "failed", "never"] as const)(
    "accepts sync status %s",
    (status) => {
      const result = toPublicStatsView({
        memberCount: 0,
        publicMemberCount: 0,
        zoneBreakdown: [],
        membershipBreakdown: [],
        meetingCountThisYear: 0,
        recentMeetings: [],
        lastSync: {
          schemaSync: status,
          responseSync: status,
          schemaSyncFinishedAt: null,
          responseSyncFinishedAt: null,
        },
        generatedAt: "2026-04-29T00:00:00+09:00",
      });
      expect(result.lastSync.schemaSync).toBe(status);
    },
  );
});
