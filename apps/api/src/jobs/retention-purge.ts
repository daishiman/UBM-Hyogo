// Issue #402: retention purge job。
// deleted_members.deleted_at + 180 日を経過した row を対象に、PII を持つ
// member_responses / member_identities / member_status / response_fields /
// response_sections を物理削除し、deleted_members は audit minimum tombstone として
// purged_at と retention_policy_version を更新する。
//
// 不変条件:
// - dry-run mode は副作用ゼロ（read-only）
// - apply mode は member 単位で原子的に処理し、子 row 残留・親 row 先消しを起こさない
// - audit_log には PII（メール / 名前 / 自由記述 reason 本文）を含めない
// - cron 重複起動でも purged_at IS NULL 条件で idempotent

import { RETENTION_DAYS, RETENTION_POLICY_VERSION } from "../services/retention-policy";

export type RetentionPurgeMode = "dry-run" | "apply";

export interface RetentionPurgeOptions {
  readonly mode: RetentionPurgeMode;
  readonly limit?: number;
  readonly now?: Date;
}

export interface RetentionPurgeTarget {
  readonly memberId: string;
  readonly deletedAt: string;
  readonly deletedAtPlus180DaysAt: string;
  readonly childCounts: {
    readonly memberResponses: number;
    readonly memberIdentities: number;
    readonly memberStatus: number;
  };
}

export interface RetentionPurgeReport {
  readonly mode: RetentionPurgeMode;
  readonly scannedAt: string;
  readonly policyVersion: string;
  readonly targets: ReadonlyArray<RetentionPurgeTarget>;
  readonly applied: ReadonlyArray<{ memberId: string; purgedAt: string }>;
  readonly errors: ReadonlyArray<{ memberId: string; message: string }>;
}

export interface RetentionPurgeEnv {
  readonly DB: D1Database;
}

const DEFAULT_LIMIT = 100;
const RETENTION_PURGE_MODE_VALUES = new Set(["off", "dry-run", "apply"]);

interface DueRow {
  member_id: string;
  deleted_at: string;
}

interface IdentityRow {
  response_email: string | null;
}

export async function runRetentionPurge(
  env: RetentionPurgeEnv,
  opts: RetentionPurgeOptions,
): Promise<RetentionPurgeReport> {
  const now = opts.now ?? new Date();
  const limit = Math.max(1, Math.floor(opts.limit ?? DEFAULT_LIMIT));
  const scannedAt = now.toISOString();
  const nowSqlArg = scannedAt;

  const dueRows = await env.DB.prepare(
    `SELECT member_id, deleted_at
       FROM deleted_members
      WHERE datetime(deleted_at, '+' || ?1 || ' days') <= datetime(?2)
        AND purged_at IS NULL
      ORDER BY deleted_at ASC
      LIMIT ?3`,
  )
    .bind(RETENTION_DAYS, nowSqlArg, limit)
    .all<DueRow>();

  const targets: RetentionPurgeTarget[] = [];
  const applied: Array<{ memberId: string; purgedAt: string }> = [];
  const errors: Array<{ memberId: string; message: string }> = [];

  for (const row of dueRows.results ?? []) {
    const childCounts = await countChildRows(env.DB, row.member_id);
    const target: RetentionPurgeTarget = {
      memberId: row.member_id,
      deletedAt: row.deleted_at,
      deletedAtPlus180DaysAt: addDaysIso(row.deleted_at, RETENTION_DAYS),
      childCounts,
    };
    targets.push(target);

    if (opts.mode === "dry-run") continue;

    try {
      const purgedAt = await purgeOne(env.DB, row.member_id, scannedAt);
      applied.push({ memberId: row.member_id, purgedAt });
    } catch (err) {
      errors.push({
        memberId: row.member_id,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    mode: opts.mode,
    scannedAt,
    policyVersion: RETENTION_POLICY_VERSION,
    targets,
    applied,
    errors,
  };
}

export function resolveRetentionPurgeOptions(env: {
  readonly RETENTION_PURGE_MODE?: string;
  readonly RETENTION_PURGE_LIMIT?: string;
}): RetentionPurgeOptions | null {
  const rawMode = env.RETENTION_PURGE_MODE ?? "dry-run";
  if (!RETENTION_PURGE_MODE_VALUES.has(rawMode)) {
    throw new Error(
      `Invalid RETENTION_PURGE_MODE=${rawMode}; expected off, dry-run, or apply`,
    );
  }
  if (rawMode === "off") return null;

  const rawLimit = env.RETENTION_PURGE_LIMIT;
  const limit =
    rawLimit === undefined || rawLimit.trim() === ""
      ? undefined
      : Number(rawLimit);
  if (limit !== undefined && (!Number.isFinite(limit) || limit < 1)) {
    throw new Error(
      `Invalid RETENTION_PURGE_LIMIT=${rawLimit}; expected positive number`,
    );
  }

  const opts: RetentionPurgeOptions = { mode: rawMode as RetentionPurgeMode };
  if (limit !== undefined) return { ...opts, limit };
  return opts;
}

async function countChildRows(
  db: D1Database,
  memberId: string,
): Promise<RetentionPurgeTarget["childCounts"]> {
  const identity = await db
    .prepare(
      "SELECT response_email FROM member_identities WHERE member_id = ?1",
    )
    .bind(memberId)
    .first<IdentityRow>();

  const memberIdentities = identity ? 1 : 0;
  const memberStatusRow = await db
    .prepare("SELECT 1 AS one FROM member_status WHERE member_id = ?1")
    .bind(memberId)
    .first<{ one: number }>();
  const memberStatus = memberStatusRow ? 1 : 0;

  let memberResponses = 0;
  if (identity?.response_email) {
    const countRow = await db
      .prepare(
        "SELECT COUNT(*) AS cnt FROM member_responses WHERE response_email = ?1",
      )
      .bind(identity.response_email)
      .first<{ cnt: number }>();
    memberResponses = countRow?.cnt ?? 0;
  }
  return { memberResponses, memberIdentities, memberStatus };
}

async function purgeOne(
  db: D1Database,
  memberId: string,
  scannedAt: string,
): Promise<string> {
  const identity = await db
    .prepare(
      "SELECT response_email FROM member_identities WHERE member_id = ?1",
    )
    .bind(memberId)
    .first<IdentityRow>();
  const email = identity?.response_email ?? null;

  // 子 → 親 順で削除する。D1 は外部キー cascade 非対応のため明示順序を必須化。
  // 1) member_responses 系の子テーブル (response_fields / response_sections)
  // 2) member_responses（履歴行）
  // 3) member_identities（親）
  // 4) member_status
  // 5) deleted_members は tombstone として残し、purged_at / retention_policy_version を更新
  const purgedAt = scannedAt;
  const auditId = `retention-purge-${memberId}-${purgedAt}`;
  const auditAfter = JSON.stringify({
    member_id: memberId,
    purged_at: purgedAt,
    retention_policy_version: RETENTION_POLICY_VERSION,
  });

  const stmts: D1PreparedStatement[] = [];
  if (email) {
    // response_fields / response_sections は response_id を経由して削除。
    stmts.push(
      db
        .prepare(
          `DELETE FROM response_fields
          WHERE response_id IN (
            SELECT response_id FROM member_responses WHERE response_email = ?1
          )`,
        )
        .bind(email),
      db
        .prepare(
          `DELETE FROM response_sections
          WHERE response_id IN (
            SELECT response_id FROM member_responses WHERE response_email = ?1
          )`,
        )
        .bind(email),
      db
        .prepare("DELETE FROM member_responses WHERE response_email = ?1")
        .bind(email),
    );
  }
  stmts.push(
    db.prepare("DELETE FROM member_identities WHERE member_id = ?1").bind(memberId),
    db.prepare("DELETE FROM member_status WHERE member_id = ?1").bind(memberId),
    db
      .prepare(
        `INSERT INTO audit_log (audit_id, action, target_type, target_id, after_json, created_at)
         SELECT ?1, 'retention_purge', 'member', ?2, ?3, ?4
           WHERE EXISTS (
             SELECT 1 FROM deleted_members
              WHERE member_id = ?2 AND purged_at IS NULL
           )`,
      )
      .bind(auditId, memberId, auditAfter, purgedAt),
    db
      .prepare(
      `UPDATE deleted_members
          SET purged_at = ?2, retention_policy_version = ?3
        WHERE member_id = ?1 AND purged_at IS NULL`,
      )
      .bind(memberId, purgedAt, RETENTION_POLICY_VERSION),
  );

  const results = await db.batch(stmts);
  const updateResult = results[results.length - 1];

  // tombstone 更新が 0 件 = idempotent guard が動作した（既に purge 済み）。
  // この場合 audit を打たないことで二重ログを防ぐ。
  if ((updateResult.meta?.changes ?? 0) === 0) {
    throw new Error(
      `deleted_members.purged_at update affected 0 rows for member_id=${memberId}`,
    );
  }

  return purgedAt;
}

function addDaysIso(baseIso: string, days: number): string {
  const base = new Date(baseIso);
  const millis = base.getTime() + days * 24 * 60 * 60 * 1000;
  return new Date(millis).toISOString();
}
