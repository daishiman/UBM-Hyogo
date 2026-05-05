// u-04: audit writer + withSyncMutex。物理は sync_job_logs。
// trigger 値は manual / scheduled / backfill。互換用に外部 'admin' を受けたら manual に正規化。

import {
  acquireSyncLock,
  releaseSyncLock,
  type SyncLock,
} from "../jobs/sync-lock";
import type {
  AuditDeps,
  AuditStatus,
  DiffSummary,
  SyncResult,
  SyncTrigger,
} from "./types";

export interface StartRunResult {
  auditId: string;
  acquired: boolean;
  reason?: string;
}

const DEFAULT_LOCK_TTL_MS = 10 * 60 * 1000;
const SYNC_LOCK_ID = "sheets-to-d1";

function lockTriggerOf(t: SyncTrigger): "cron" | "admin" | "backfill" {
  if (t === "manual") return "admin";
  if (t === "scheduled") return "cron";
  return "backfill";
}

export async function startRun(
  deps: AuditDeps,
  trigger: SyncTrigger,
  ttlMs: number = DEFAULT_LOCK_TTL_MS,
): Promise<{ result: StartRunResult; lock: SyncLock | null }> {
  const auditId = deps.newId();
  const lock = await acquireSyncLock(deps.db, {
    holder: auditId,
    triggerType: lockTriggerOf(trigger),
    ttlMs,
    now: deps.now,
  });
  if (!lock) {
    const startedAt = deps.now().toISOString();
    await deps.db
      .prepare(
        `INSERT INTO sync_job_logs (run_id, trigger_type, status, started_at, finished_at, error_reason, duration_ms)
         VALUES (?1, ?2, 'skipped', ?3, ?3, ?4, 0)`,
      )
      .bind(auditId, trigger, startedAt, "another sync is in progress")
      .run();
    return {
      result: { auditId, acquired: false, reason: "another sync is in progress" },
      lock: null,
    };
  }
  try {
    await deps.db
      .prepare(
        "INSERT INTO sync_job_logs (run_id, trigger_type, status, started_at) VALUES (?1, ?2, 'running', ?3)",
      )
      .bind(auditId, trigger, deps.now().toISOString())
      .run();
  } catch (err) {
    await releaseSyncLock(deps.db, lock).catch(() => undefined);
    throw err;
  }
  return { result: { auditId, acquired: true }, lock };
}

export async function finishRun(
  deps: AuditDeps,
  auditId: string,
  status: "success" | "failed",
  summary: DiffSummary,
  errorReason: string | null,
): Promise<void> {
  const finishedAt = deps.now().toISOString();
  await deps.db
    .prepare(
      `UPDATE sync_job_logs SET status = ?2, finished_at = ?3, fetched_count = ?4,
        upserted_count = ?5, failed_count = ?6, retry_count = ?7, duration_ms = ?8, error_reason = ?9
       WHERE run_id = ?1 AND status = 'running'`,
    )
    .bind(
      auditId,
      status,
      finishedAt,
      summary.fetched,
      summary.upserted,
      summary.failed,
      summary.retryCount,
      summary.durationMs,
      errorReason,
    )
    .run();
}

function redact(message: string): string {
  return message
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "<email>")
    .slice(0, 1000);
}

export async function withSyncMutex(
  deps: AuditDeps,
  trigger: SyncTrigger,
  body: (auditId: string) => Promise<DiffSummary>,
): Promise<SyncResult> {
  const startedAt = deps.now();
  const { result, lock } = await startRun(deps, trigger);
  if (!result.acquired) {
    const skipped: SyncResult = {
      status: "skipped",
      auditId: result.auditId,
      fetched: 0,
      upserted: 0,
      failed: 0,
      retryCount: 0,
      durationMs: 0,
    };
    if (result.reason) skipped.errorReason = result.reason;
    return skipped;
  }
  let summary: DiffSummary = {
    fetched: 0,
    upserted: 0,
    failed: 0,
    retryCount: 0,
    durationMs: 0,
  };
  let resultStatus: "success" | "failed" = "success";
  let errorReason: string | null = null;
  try {
    summary = await body(result.auditId);
    summary.durationMs = deps.now().getTime() - startedAt.getTime();
  } catch (err) {
    resultStatus = "failed";
    errorReason = redact(err instanceof Error ? err.message : String(err));
    summary.durationMs = deps.now().getTime() - startedAt.getTime();
  } finally {
    try {
      await finishRun(deps, result.auditId, resultStatus, summary, errorReason);
    } catch (err) {
      resultStatus = "failed";
      errorReason = redact(err instanceof Error ? err.message : String(err));
      summary.failed = Math.max(1, summary.failed);
    }
    if (lock) await releaseSyncLock(deps.db, lock).catch(() => undefined);
  }
  return {
    status: resultStatus,
    auditId: result.auditId,
    ...summary,
    ...(errorReason ? { errorReason } : {}),
  };
}

export interface AuditRow {
  auditId: string;
  trigger: string;
  status: AuditStatus;
  startedAt: string;
  finishedAt: string | null;
  fetchedCount: number;
  upsertedCount: number;
  failedCount: number;
  retryCount: number;
  durationMs: number | null;
  errorReason: string | null;
}

export async function listRecent(
  db: D1Database,
  limit: number,
): Promise<AuditRow[]> {
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const rs = await db
    .prepare(
      `SELECT run_id, trigger_type, status, started_at, finished_at,
              fetched_count, upserted_count, failed_count, retry_count, duration_ms, error_reason
       FROM sync_job_logs ORDER BY started_at DESC LIMIT ?1`,
    )
    .bind(safeLimit)
    .all<{
      run_id: string;
      trigger_type: string;
      status: AuditStatus;
      started_at: string;
      finished_at: string | null;
      fetched_count: number;
      upserted_count: number;
      failed_count: number;
      retry_count: number;
      duration_ms: number | null;
      error_reason: string | null;
    }>();
  return (rs.results ?? []).map((r) => ({
    auditId: r.run_id,
    trigger: r.trigger_type,
    status: r.status,
    startedAt: r.started_at,
    finishedAt: r.finished_at,
    fetchedCount: r.fetched_count,
    upsertedCount: r.upserted_count,
    failedCount: r.failed_count,
    retryCount: r.retry_count,
    durationMs: r.duration_ms,
    errorReason: r.error_reason,
  }));
}
