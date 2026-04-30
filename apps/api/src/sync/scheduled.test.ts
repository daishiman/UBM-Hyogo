// @vitest-environment node
// u-04: scheduled sync の cursor 取得と全件 upsert 方針を検証する。

import { describe, it, expect } from "vitest";
import { setupD1 } from "../repository/__tests__/_setup";
import { runScheduledSync, readLastSuccessCursor } from "./scheduled";

describe("u-04 scheduled sync", () => {
  it("I-04: cursor 未設定 (logs 空) では null を返す", async () => {
    const env = await setupD1();
    await env.reset();
    const cursor = await readLastSuccessCursor(env.db);
    expect(cursor).toBeNull();
  });

  it("I-05: success 行があれば最大 finished_at を返す", async () => {
    const env = await setupD1();
    await env.reset();
    await env.db
      .prepare(
        `INSERT INTO sync_job_logs (run_id, trigger_type, status, started_at, finished_at)
         VALUES ('p1', 'manual', 'success', '2026-04-29T00:00:00.000Z', '2026-04-29T00:01:00.000Z'),
                ('p2', 'scheduled', 'success', '2026-04-30T00:00:00.000Z', '2026-04-30T00:01:00.000Z'),
                ('p3', 'manual', 'failed',  '2026-04-30T01:00:00.000Z', '2026-04-30T01:01:00.000Z')`,
      )
      .run();
    const cursor = await readLastSuccessCursor(env.db);
    expect(cursor).toBe("2026-04-30T00:01:00.000Z");
  });

  it("I-06: runScheduledSync は cursor を読みつつ全件 upsert として trigger=scheduled で audit する", async () => {
    const env = await setupD1();
    await env.reset();
    let invoked = 0;
    const r = await runScheduledSync(
      { DB: env.db, SYNC_ADMIN_TOKEN: "x" } as never,
      {
        cursorReader: async () => "2026-04-29T00:00:00.000Z",
        fetchValues: async () => {
          invoked += 1;
          return {
            values: [
              ["タイムスタンプ", "メールアドレス", "回答ID", "氏名"],
            ],
            retryCount: 0,
          };
        },
        now: () => new Date("2026-04-30T02:00:00.000Z"),
        newId: () => "sch-1",
      },
    );
    expect(r.status).toBe("success");
    expect(invoked).toBe(1);
    const row = await env.db
      .prepare("SELECT trigger_type FROM sync_job_logs WHERE run_id = ?1")
      .bind("sch-1")
      .first<{ trigger_type: string }>();
    expect(row?.trigger_type).toBe("scheduled");
  });
});
