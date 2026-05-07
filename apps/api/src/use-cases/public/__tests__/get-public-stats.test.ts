// UT-08A-01: get-public-stats use-case unit test。
// happy / sync_jobs null → never / D1 failure を担保する。
import { afterEach, describe, expect, it, vi } from "vitest";

import { getPublicStats } from "../get-public-stats";
import {
  buildMeetingRow,
  buildPublicMemberRow,
  buildResponseFieldRow,
  buildSyncJobRow,
  createPublicD1Mock,
} from "./helpers/public-d1";

describe("getPublicStats", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("公開フィルタを通った member 集計と sync 状態を view に組み立てる", async () => {
    vi.setSystemTime(new Date("2026-05-03T00:00:00.000Z"));
    const db = createPublicD1Mock({
      publicMembers: [
        buildPublicMemberRow({ member_id: "m-1", current_response_id: "r-1" }),
        buildPublicMemberRow({ member_id: "m-2", current_response_id: "r-2" }),
      ],
      publicMemberCount: 2,
      responseFieldsByResponseId: {
        "r-1": [
          buildResponseFieldRow({
            stable_key: "ubmZone",
            value_json: JSON.stringify("0_to_1"),
          }),
          buildResponseFieldRow({
            stable_key: "ubmMembershipType",
            value_json: JSON.stringify("member"),
          }),
        ],
        "r-2": [
          buildResponseFieldRow({
            stable_key: "ubmZone",
            value_json: JSON.stringify("1_to_10"),
          }),
        ],
      },
      meetings: [
        buildMeetingRow({ session_id: "s-1", held_on: "2026-03-15" }),
        buildMeetingRow({
          session_id: "s-2",
          held_on: "2025-12-31",
          title: "前年定例",
        }),
      ],
      syncJobs: {
        schema_sync: buildSyncJobRow({ jobType: "schema_sync", status: "succeeded" }),
        response_sync: buildSyncJobRow({
          jobType: "response_sync",
          status: "running",
        }),
      },
    });

    const result = await getPublicStats({ ctx: { db: db as never } });
    expect(result.publicMemberCount).toBe(2);
    expect(result.lastSync.schemaSync).toBe("ok");
    expect(result.lastSync.responseSync).toBe("running");
    expect(result.recentMeetings.map((m) => m.sessionId)).toContain("s-1");
  });

  it("sync_jobs が空のとき lastSync は never を返す", async () => {
    const db = createPublicD1Mock({
      publicMembers: [],
      publicMemberCount: 0,
      meetings: [],
      syncJobs: { schema_sync: null, response_sync: null },
    });
    const result = await getPublicStats({ ctx: { db: db as never } });
    expect(result.lastSync.schemaSync).toBe("never");
    expect(result.lastSync.responseSync).toBe("never");
    expect(result.publicMemberCount).toBe(0);
  });

  it("D1 failure を伝播させる", async () => {
    const db = createPublicD1Mock({ failOnSql: /sync_jobs/ });
    await expect(
      getPublicStats({ ctx: { db: db as never } }),
    ).rejects.toThrow(/MockD1Failure/);
  });
});
