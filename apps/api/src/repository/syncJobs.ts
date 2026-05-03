// sync_jobs repository（lifecycle）
// AC-8: status transition は running -> succeeded/failed の一方向。逆禁止。
// DDL: sync_jobs(job_id PK, job_type, started_at, finished_at, status, error_json, metrics_json)
import type { DbCtx } from "./_shared/db";
import {
  assertNoPii,
  metricsJsonBaseSchema,
  parseMetricsJson,
  type SyncJobKind,
} from "../jobs/_shared/sync-jobs-schema";

export type { SyncJobKind };
export type SyncJobStatus = "running" | "succeeded" | "failed";

export const ALLOWED_TRANSITIONS: Readonly<
  Record<SyncJobStatus, readonly SyncJobStatus[]>
> = Object.freeze({
  running: ["succeeded", "failed"],
  succeeded: [],
  failed: [],
});

export class IllegalStateTransition extends Error {
  readonly name = "IllegalStateTransition";
  constructor(
    readonly from: SyncJobStatus,
    readonly to: SyncJobStatus,
  ) {
    super(`sync_jobs: ${from} -> ${to} is not allowed`);
  }
}

export class SyncJobNotFound extends Error {
  readonly name = "SyncJobNotFound";
  constructor(readonly jobId: string) {
    super(`sync_job ${jobId} not found`);
  }
}

export interface SyncJobRow {
  jobId: string;
  jobType: SyncJobKind;
  status: SyncJobStatus;
  startedAt: string;
  finishedAt: string | null;
  metrics: Record<string, unknown>;
  error: Record<string, unknown> | null;
}

interface RawJobRow {
  jobId: string;
  jobType: SyncJobKind;
  status: SyncJobStatus;
  startedAt: string;
  finishedAt: string | null;
  metricsJson: string;
  errorJson: string | null;
}

const SELECT_COLS =
  "job_id AS jobId, job_type AS jobType, status, started_at AS startedAt, finished_at AS finishedAt, metrics_json AS metricsJson, error_json AS errorJson";

const parseJson = <T,>(s: string | null, fallback: T): T => {
  if (s === null || s === "") return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
};

const toRow = (r: RawJobRow): SyncJobRow => ({
  jobId: r.jobId,
  jobType: r.jobType,
  status: r.status,
  startedAt: r.startedAt,
  finishedAt: r.finishedAt,
  metrics: parseMetricsJson(r.metricsJson, metricsJsonBaseSchema, {}),
  error: parseJson<Record<string, unknown> | null>(r.errorJson, null),
});

const loadJob = async (c: DbCtx, jobId: string): Promise<SyncJobRow> => {
  const r = await c.db
    .prepare(`SELECT ${SELECT_COLS} FROM sync_jobs WHERE job_id = ?1`)
    .bind(jobId)
    .first<RawJobRow>();
  if (!r) throw new SyncJobNotFound(jobId);
  return toRow(r);
};

const loadStatus = async (
  c: DbCtx,
  jobId: string,
): Promise<SyncJobStatus> => {
  const cur = await c.db
    .prepare("SELECT status FROM sync_jobs WHERE job_id = ?1")
    .bind(jobId)
    .first<{ status: SyncJobStatus }>();
  if (!cur) throw new SyncJobNotFound(jobId);
  return cur.status;
};

const assertTransition = async (
  c: DbCtx,
  jobId: string,
  to: SyncJobStatus,
): Promise<SyncJobStatus> => {
  const current = await loadStatus(c, jobId);
  if (!ALLOWED_TRANSITIONS[current].includes(to)) {
    throw new IllegalStateTransition(current, to);
  }
  return current;
};

const assertRunningUpdateChanged = async (
  c: DbCtx,
  jobId: string,
  to: Exclude<SyncJobStatus, "running">,
  changes: number | undefined,
): Promise<void> => {
  if ((changes ?? 0) > 0) return;
  const current = await loadStatus(c, jobId);
  if (current === "running") {
    throw new IllegalStateTransition(current, to);
  }
  throw new IllegalStateTransition(current, to);
};

export const start = async (
  c: DbCtx,
  jobType: SyncJobKind,
): Promise<SyncJobRow> => {
  const jobId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  await c.db
    .prepare(
      "INSERT INTO sync_jobs (job_id, job_type, started_at, status, metrics_json) VALUES (?1, ?2, ?3, 'running', '{}')",
    )
    .bind(jobId, jobType, startedAt)
    .run();
  return {
    jobId,
    jobType,
    status: "running",
    startedAt,
    finishedAt: null,
    metrics: {},
    error: null,
  };
};

export const succeed = async (
  c: DbCtx,
  jobId: string,
  metrics: Record<string, unknown>,
): Promise<SyncJobRow> => {
  await assertTransition(c, jobId, "succeeded");
  assertNoPii(metrics);
  const finishedAt = new Date().toISOString();
  const result = await c.db
    .prepare(
      "UPDATE sync_jobs SET status = 'succeeded', finished_at = ?1, metrics_json = ?2 WHERE job_id = ?3 AND status = 'running'",
    )
    .bind(finishedAt, JSON.stringify(metrics), jobId)
    .run();
  await assertRunningUpdateChanged(c, jobId, "succeeded", result.meta.changes);
  return loadJob(c, jobId);
};

export const fail = async (
  c: DbCtx,
  jobId: string,
  error: Record<string, unknown>,
): Promise<SyncJobRow> => {
  await assertTransition(c, jobId, "failed");
  const finishedAt = new Date().toISOString();
  const result = await c.db
    .prepare(
      "UPDATE sync_jobs SET status = 'failed', finished_at = ?1, error_json = ?2 WHERE job_id = ?3 AND status = 'running'",
    )
    .bind(finishedAt, JSON.stringify(error), jobId)
    .run();
  await assertRunningUpdateChanged(c, jobId, "failed", result.meta.changes);
  return loadJob(c, jobId);
};

export const findLatest = async (
  c: DbCtx,
  jobType: SyncJobKind,
): Promise<SyncJobRow | null> => {
  const r = await c.db
    .prepare(
      `SELECT ${SELECT_COLS} FROM sync_jobs WHERE job_type = ?1 ORDER BY started_at DESC LIMIT 1`,
    )
    .bind(jobType)
    .first<RawJobRow>();
  return r ? toRow(r) : null;
};

export const listRecent = async (
  c: DbCtx,
  limit: number,
): Promise<SyncJobRow[]> => {
  const r = await c.db
    .prepare(
      `SELECT ${SELECT_COLS} FROM sync_jobs ORDER BY started_at DESC LIMIT ?1`,
    )
    .bind(limit)
    .all<RawJobRow>();
  return (r.results ?? []).map(toRow);
};
