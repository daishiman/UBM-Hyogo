// Issue #836: schema alias recompute job repository
// 対象テーブル: schema_alias_recompute_jobs（migration 0020）
// idempotency: (alias_id, stable_key, trigger_key) UNIQUE。createOrGetJob が既存 job を返す。
import type { DbCtx } from "./_shared/db";

export type RecomputeJobStatus = "pending" | "running" | "completed" | "failed";

export interface RecomputeJobRow {
  jobId: string;
  aliasId: string;
  stableKey: string;
  questionId: string;
  triggerKey: string;
  status: RecomputeJobStatus;
  affectedCount: number;
  processedCount: number;
  updatedCount: number;
  deletedCollisionCount: number;
  cursor: string | null;
  recomputeAuditId: string | null;
  lockedAt: string | null;
  lockedBy: string | null;
  runToken: string | null;
  lastError: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface DbRow {
  job_id: string;
  alias_id: string;
  stable_key: string;
  question_id: string;
  trigger_key: string;
  status: RecomputeJobStatus;
  affected_count: number;
  processed_count: number;
  updated_count: number;
  deleted_collision_count: number;
  cursor: string | null;
  recompute_audit_id: string | null;
  locked_at: string | null;
  locked_by: string | null;
  run_token: string | null;
  last_error: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const SELECT_COLS =
  "job_id, alias_id, stable_key, question_id, trigger_key, status, affected_count, processed_count, updated_count, deleted_collision_count, cursor, recompute_audit_id, locked_at, locked_by, run_token, last_error, created_by, created_at, updated_at";

// running job が放棄されたとみなすまでの lease 期限（ms）。
export const RECOMPUTE_LEASE_MS = 60_000;

const num = (v: number | null | undefined): number =>
  typeof v === "number" ? v : Number(v ?? 0);

const map = (r: DbRow): RecomputeJobRow => ({
  jobId: r.job_id,
  aliasId: r.alias_id,
  stableKey: r.stable_key,
  questionId: r.question_id,
  triggerKey: r.trigger_key,
  status: r.status,
  affectedCount: num(r.affected_count),
  processedCount: num(r.processed_count),
  updatedCount: num(r.updated_count),
  deletedCollisionCount: num(r.deleted_collision_count),
  cursor: r.cursor,
  recomputeAuditId: r.recompute_audit_id,
  lockedAt: r.locked_at,
  lockedBy: r.locked_by,
  runToken: r.run_token,
  lastError: r.last_error,
  createdBy: r.created_by,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const newId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `rcj_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

async function findByTrigger(
  c: DbCtx,
  aliasId: string,
  stableKey: string,
  triggerKey: string,
): Promise<RecomputeJobRow | null> {
  const r = await c.db
    .prepare(
      `SELECT ${SELECT_COLS} FROM schema_alias_recompute_jobs
       WHERE alias_id = ?1 AND stable_key = ?2 AND trigger_key = ?3 LIMIT 1`,
    )
    .bind(aliasId, stableKey, triggerKey)
    .first<DbRow>();
  return r ? map(r) : null;
}

export interface CreateOrGetJobInput {
  aliasId: string;
  stableKey: string;
  questionId: string;
  triggerKey: string;
  createdBy: string;
}

/**
 * (alias_id, stable_key, trigger_key) UNIQUE で既存 job を返すか、無ければ pending で新規作成する。
 * 既存が completed なら reverse-backfill / audit を再実行しないよう呼び出し側で判定する。
 */
export async function createOrGetJob(
  c: DbCtx,
  input: CreateOrGetJobInput,
): Promise<RecomputeJobRow> {
  const existing = await findByTrigger(
    c,
    input.aliasId,
    input.stableKey,
    input.triggerKey,
  );
  if (existing) return existing;

  const now = new Date().toISOString();
  const jobId = newId();
  await c.db
    .prepare(
      `INSERT INTO schema_alias_recompute_jobs
       (job_id, alias_id, stable_key, question_id, trigger_key, status, created_by, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, 'pending', ?6, ?7, ?7)
       ON CONFLICT (alias_id, stable_key, trigger_key) DO NOTHING`,
    )
    .bind(
      jobId,
      input.aliasId,
      input.stableKey,
      input.questionId,
      input.triggerKey,
      input.createdBy,
      now,
    )
    .run();
  // ON CONFLICT で別 runner が先に INSERT した場合も既存行を返す。
  const row = await findByTrigger(
    c,
    input.aliasId,
    input.stableKey,
    input.triggerKey,
  );
  if (!row) throw new Error("recompute job insert failed");
  return row;
}

export interface ClaimJobInput {
  jobId: string;
  runToken: string;
  lockedBy: string;
  now: string;
  leaseMs?: number;
}

/**
 * conditional update で job を running として claim する。
 * status が pending/failed、または lease 期限切れ（locked_at < now-leaseMs）のときのみ成立。
 * 変更 0 件（= 別 runner が保持中）なら false を返す。
 */
export async function claimJob(
  c: DbCtx,
  input: ClaimJobInput,
): Promise<boolean> {
  const leaseMs = input.leaseMs ?? RECOMPUTE_LEASE_MS;
  const leaseExpiry = new Date(Date.parse(input.now) - leaseMs).toISOString();
  const res = await c.db
    .prepare(
      `UPDATE schema_alias_recompute_jobs
       SET status = 'running', run_token = ?2, locked_by = ?3, locked_at = ?4, updated_at = ?4
       WHERE job_id = ?1
         AND status != 'completed'
         AND (run_token IS NULL OR status IN ('pending','failed') OR locked_at IS NULL OR locked_at < ?5)`,
    )
    .bind(input.jobId, input.runToken, input.lockedBy, input.now, leaseExpiry)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

export interface UpdateJobStatusInput {
  jobId: string;
  runToken?: string;
  status: RecomputeJobStatus;
  affectedCount?: number;
  processedCount?: number;
  updatedCount?: number;
  deletedCollisionCount?: number;
  cursor?: string | null;
  recomputeAuditId?: string | null;
  lastError?: string | null;
  now?: string;
}

/**
 * job の status / 集計カウンタ / cursor を更新する。指定された field のみ上書きする。
 * runToken 指定時は現在の claim owner だけが終端 write できる。
 * 同期 1 invocation のスライス終端で必ず lease（run_token / locked_at）を解放する。
 * これにより running（CPU budget 跨ぎ）でも次回 POST が即座に継続 claim できる。
 * lease の本来の役割は「同時実行中の runner 排他」なので、処理完了時は常に解放してよい。
 */
export async function updateJobStatus(
  c: DbCtx,
  input: UpdateJobStatusInput,
): Promise<void> {
  const now = input.now ?? new Date().toISOString();
  await c.db
    .prepare(
      `UPDATE schema_alias_recompute_jobs
       SET status = ?2,
           affected_count = COALESCE(?3, affected_count),
           processed_count = COALESCE(?4, processed_count),
           updated_count = COALESCE(?5, updated_count),
           deleted_collision_count = COALESCE(?6, deleted_collision_count),
           cursor = ?7,
           recompute_audit_id = COALESCE(?8, recompute_audit_id),
           last_error = ?9,
           run_token = NULL,
           locked_at = NULL,
           locked_by = NULL,
           updated_at = ?10
       WHERE job_id = ?1
         AND (?11 IS NULL OR run_token = ?11)`,
    )
    .bind(
      input.jobId,
      input.status,
      input.affectedCount ?? null,
      input.processedCount ?? null,
      input.updatedCount ?? null,
      input.deletedCollisionCount ?? null,
      input.cursor ?? null,
      input.recomputeAuditId ?? null,
      input.lastError ?? null,
      now,
      input.runToken ?? null,
    )
    .run();
}

/** alias 単位の直近 job を返す（UI status バッジ / poll 用）。 */
export async function getLatestJobByAlias(
  c: DbCtx,
  aliasId: string,
): Promise<RecomputeJobRow | null> {
  const r = await c.db
    .prepare(
      `SELECT ${SELECT_COLS} FROM schema_alias_recompute_jobs
       WHERE alias_id = ?1 ORDER BY created_at DESC, job_id DESC LIMIT 1`,
    )
    .bind(aliasId)
    .first<DbRow>();
  return r ? map(r) : null;
}

export async function getById(
  c: DbCtx,
  jobId: string,
): Promise<RecomputeJobRow | null> {
  const r = await c.db
    .prepare(
      `SELECT ${SELECT_COLS} FROM schema_alias_recompute_jobs WHERE job_id = ?1 LIMIT 1`,
    )
    .bind(jobId)
    .first<DbRow>();
  return r ? map(r) : null;
}
