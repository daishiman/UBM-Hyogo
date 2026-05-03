// issue-194-03b-followup-001-email-conflict-identity-merge
// merge transaction:
//   1. source / target identity 存在確認
//   2. identity_aliases に source -> target を guarded insert（UNIQUE で二重 merge を 409）
//   3. identity_merge_audit に actor / source / target / reason / merged_at / sync_job_id を insert
//   4. audit_log に action='identity.merge' / target_type='member' を append
//
// raw member_responses / response_fields / member_status は更新しない（不変条件 #11）。
// canonical 解決は identity_aliases を view / repository 側で参照する。
import type { DbCtx, D1Db } from "./_shared/db";
import type { MergeIdentityResponse } from "@ubm-hyogo/shared";
import type { AdminId, AdminEmail, AuditAction } from "./_shared/brand";

export class MergeConflictAlreadyApplied extends Error {
  readonly name = "MergeConflictAlreadyApplied";
  constructor(readonly sourceMemberId: string) {
    super(`identity already merged: source=${sourceMemberId}`);
  }
}

export class MergeIdentityNotFound extends Error {
  readonly name = "MergeIdentityNotFound";
  constructor(readonly memberId: string) {
    super(`member identity not found: ${memberId}`);
  }
}

export class MergeSelfReference extends Error {
  readonly name = "MergeSelfReference";
  constructor() {
    super("source and target must differ");
  }
}

export class MergeAtomicBatchUnavailable extends Error {
  readonly name = "MergeAtomicBatchUnavailable";
  constructor() {
    super("D1 batch is required for atomic identity merge");
  }
}

const PII_REASON =
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|\+?[\d\s().-]{8,}/g;

export const redactIdentityReason = (reason: string): string =>
  reason.replace(PII_REASON, "[redacted]").slice(0, 500);

const memberExists = async (db: D1Db, memberId: string): Promise<boolean> => {
  const r = await db
    .prepare(
      "SELECT 1 AS x FROM member_identities WHERE member_id = ?1 LIMIT 1",
    )
    .bind(memberId)
    .first<{ x: number }>();
  return r !== null;
};

const aliasAlreadyExists = async (
  db: D1Db,
  source: string,
): Promise<boolean> => {
  const r = await db
    .prepare(
      "SELECT 1 AS x FROM identity_aliases WHERE source_member_id = ?1 LIMIT 1",
    )
    .bind(source)
    .first<{ x: number }>();
  return r !== null;
};

const fetchSyncJobIdForEmailConflict = async (
  db: D1Db,
): Promise<string | null> => {
  const r = await db
    .prepare(
      `SELECT job_id AS jobId FROM sync_jobs
       WHERE error_json IS NOT NULL
         AND json_extract(error_json, '$.code') = 'EMAIL_CONFLICT'
       ORDER BY started_at DESC LIMIT 1`,
    )
    .first<{ jobId: string }>();
  return r?.jobId ?? null;
};

export async function mergeIdentities(
  c: DbCtx,
  args: {
    sourceMemberId: string;
    targetMemberId: string;
    actorAdminId: string;
    actorAdminEmail: string | null;
    reason: string;
  },
): Promise<MergeIdentityResponse> {
  const { sourceMemberId, targetMemberId, actorAdminId, actorAdminEmail, reason } = args;
  if (sourceMemberId === targetMemberId) throw new MergeSelfReference();

  const db = c.db;

  if (!(await memberExists(db, sourceMemberId))) {
    throw new MergeIdentityNotFound(sourceMemberId);
  }
  if (!(await memberExists(db, targetMemberId))) {
    throw new MergeIdentityNotFound(targetMemberId);
  }
  if (await aliasAlreadyExists(db, sourceMemberId)) {
    throw new MergeConflictAlreadyApplied(sourceMemberId);
  }

  const aliasId = crypto.randomUUID();
  const auditId = crypto.randomUUID();
  const auditLogId = crypto.randomUUID();
  const mergedAt = new Date().toISOString();
  const reasonRedacted = redactIdentityReason(reason);
  const syncJobId = await fetchSyncJobIdForEmailConflict(db);
  const auditBefore = JSON.stringify({ sourceMemberId, targetMemberId, syncJobId });
  const auditAfter = JSON.stringify({ aliasId, auditId, mergedAt });

  // D1 transactional batch (atomic apply)
  const stmts = [
    db
      .prepare(
        `INSERT INTO identity_aliases
           (alias_id, source_member_id, target_member_id, created_by, created_at, reason_redacted)
         VALUES (?1,?2,?3,?4,?5,?6)`,
      )
      .bind(aliasId, sourceMemberId, targetMemberId, actorAdminId, mergedAt, reasonRedacted),
    db
      .prepare(
        `INSERT INTO identity_merge_audit
           (audit_id, actor_admin_id, source_member_id, target_member_id,
            reason, merged_at, sync_job_id)
         VALUES (?1,?2,?3,?4,?5,?6,?7)`,
      )
      .bind(auditId, actorAdminId, sourceMemberId, targetMemberId, reasonRedacted, mergedAt, syncJobId),
    db
      .prepare(
        `INSERT INTO audit_log
           (audit_id, actor_id, actor_email, action, target_type, target_id,
            before_json, after_json, created_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)`,
      )
      .bind(
        auditLogId,
        actorAdminId as AdminId,
        (actorAdminEmail ?? null) as AdminEmail | null,
        "identity.merge" as AuditAction,
        "member",
        targetMemberId,
        auditBefore,
        auditAfter,
        mergedAt,
      ),
  ];

  if (typeof db.batch !== "function") {
    throw new MergeAtomicBatchUnavailable();
  }
  try {
    await db.batch(stmts);
  } catch (err) {
    const m = err instanceof Error ? err.message : String(err);
    if (/UNIQUE|constraint/i.test(m)) {
      throw new MergeConflictAlreadyApplied(sourceMemberId);
    }
    throw err;
  }

  return {
    mergedAt,
    targetMemberId,
    archivedSourceMemberId: sourceMemberId,
    auditId,
  };
}

export async function resolveCanonicalMemberId(
  c: DbCtx,
  memberId: string,
): Promise<string> {
  const r = await c.db
    .prepare(
      "SELECT target_member_id AS targetMemberId FROM identity_aliases WHERE source_member_id = ?1 LIMIT 1",
    )
    .bind(memberId)
    .first<{ targetMemberId: string }>();
  return r?.targetMemberId ?? memberId;
}
