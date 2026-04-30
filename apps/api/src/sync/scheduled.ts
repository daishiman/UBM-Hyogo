// u-04: Workers scheduled handler。
// cursor = sync_job_logs から trigger_type IN (manual, scheduled, admin, cron) で
// status='success' の最大 finished_at を取得。

import { withSyncMutex } from "./audit";
import { runFetchMapUpsert, type ManualSyncDeps } from "./manual";
import type { AuditDeps, SyncEnvBase, SyncResult } from "./types";

export async function readLastSuccessCursor(
  db: D1Database,
): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT MAX(finished_at) AS cursor FROM sync_job_logs
       WHERE status = 'success' AND trigger_type IN ('manual','scheduled','admin','cron')`,
    )
    .first<{ cursor: string | null }>();
  return row?.cursor ?? null;
}

export async function runScheduledSync(
  env: SyncEnvBase,
  deps: ManualSyncDeps & { cursorReader?: (db: D1Database) => Promise<string | null> } = {},
): Promise<SyncResult> {
  const auditDeps: AuditDeps = {
    db: env.DB,
    now: deps.now ?? (() => new Date()),
    newId: deps.newId ?? (() => crypto.randomUUID()),
  };
  const cursorReader = deps.cursorReader ?? readLastSuccessCursor;
  return withSyncMutex(auditDeps, "scheduled", async () => {
    await cursorReader(env.DB);
    // MVP は timestamp drift による取りこぼしを避けるため毎時全件 upsert する。
    return runFetchMapUpsert(env, deps, null);
  });
}
