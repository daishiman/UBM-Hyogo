// @vitest-environment node
// u-04: backfill (truncate-and-reload) の不変条件 #4 確認テスト。

import { describe, it, expect } from "vitest";
import { setupD1 } from "../repository/__tests__/_setup";
import { runBackfill } from "./backfill";

const HEADER = ["タイムスタンプ", "メールアドレス", "回答ID", "氏名"];

describe("u-04 backfill", () => {
  it("I-07: backfill 経路が動作し member_status admin 列を変更しない", async () => {
    const env = await setupD1();
    await env.reset();
    await env.db
      .prepare(
        `INSERT INTO member_status (member_id, publish_state, is_deleted)
         VALUES ('m-1', 'published', 0)`,
      )
      .run();

    const r = await runBackfill(
      { DB: env.db, SYNC_ADMIN_TOKEN: "tok" } as never,
      {
        fetchValues: async () => ({
          values: [
            HEADER,
            ["2026/04/30 09:00:00", "a@example.com", "resp-1", "山田 太郎"],
          ],
          retryCount: 0,
        }),
        now: () => new Date("2026-04-30T00:00:00.000Z"),
        newId: () => "bf-1",
      },
    );
    expect(r.status).toBe("success");

    // 不変条件 #4: member_status は触らない
    const status = await env.db
      .prepare(
        "SELECT publish_state, is_deleted FROM member_status WHERE member_id = 'm-1'",
      )
      .first<{ publish_state: string; is_deleted: number }>();
    expect(status?.publish_state).toBe("published");
    expect(status?.is_deleted).toBe(0);

    // backfill は trigger=backfill で audit に記録される
    const log = await env.db
      .prepare("SELECT trigger_type FROM sync_job_logs WHERE run_id = ?1")
      .bind("bf-1")
      .first<{ trigger_type: string }>();
    expect(log?.trigger_type).toBe("backfill");
  });

  it("I-10: backfill は valid row 0 件なら destructive delete しない", async () => {
    const env = await setupD1();
    await env.reset();
    await env.db
      .prepare(
        `INSERT INTO member_responses
           (response_id, form_id, revision_id, schema_hash, submitted_at, response_email, answers_json)
         VALUES ('existing', 'f', 'rev', 'hash', '2026-04-29T00:00:00.000Z', 'old@example.com', '{}')`,
      )
      .run();

    const r = await runBackfill(
      { DB: env.db, SYNC_ADMIN_TOKEN: "tok" } as never,
      {
        fetchValues: async () => ({ values: [HEADER], retryCount: 0 }),
        now: () => new Date("2026-04-30T00:00:00.000Z"),
        newId: () => "bf-empty",
      },
    );

    expect(r.status).toBe("failed");
    const row = await env.db
      .prepare("SELECT response_id FROM member_responses WHERE response_id = 'existing'")
      .first<{ response_id: string }>();
    expect(row?.response_id).toBe("existing");
  });
});
