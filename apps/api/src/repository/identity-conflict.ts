// issue-194-03b-followup-001-email-conflict-identity-merge
// admin identity-conflict 候補一覧 / dismiss 永続化
//
// 第一段階の候補抽出は member_identities × response_fields(name=fullName,
// affiliation=occupation) の name+affiliation 完全一致 group を使う。
// sync_jobs.error_json には source memberId が記録されないため、
// 「name+affiliation 一致 かつ alias 未登録 かつ dismiss 未登録」を candidate と定義する。
import type { DbCtx } from "./_shared/db";
import type {
  IdentityConflictRow,
  ListIdentityConflictsResponse,
} from "@ubm-hyogo/shared";
import { maskResponseEmail, FieldByStableKeyZ } from "@ubm-hyogo/shared";
import { detectConflictCandidates } from "../services/admin/identity-conflict-detector";
import { redactIdentityReason } from "./identity-merge";

// stableKey は supply module (FieldByStableKeyZ) から派生。
// fullName を identity の name、occupation を affiliation として使う。
type StableKey = keyof typeof FieldByStableKeyZ;
const NAME_KEY: StableKey = "fullName";
const AFFILIATION_KEY: StableKey = "occupation";

interface IdentitySnapshotRow {
  memberId: string;
  responseEmail: string;
  currentResponseId: string;
  lastSubmittedAt: string;
  name: string | null;
  affiliation: string | null;
}

const fetchIdentitySnapshots = async (
  c: DbCtx,
): Promise<IdentitySnapshotRow[]> => {
  const { results } = await c.db
    .prepare(
      `SELECT
         mi.member_id           AS memberId,
         mi.response_email      AS responseEmail,
         mi.current_response_id AS currentResponseId,
         mi.last_submitted_at   AS lastSubmittedAt,
         (SELECT json_extract(rf.value_json, '$') FROM response_fields rf
            WHERE rf.response_id = mi.current_response_id AND rf.stable_key = ?1) AS name,
         (SELECT json_extract(rf.value_json, '$') FROM response_fields rf
            WHERE rf.response_id = mi.current_response_id AND rf.stable_key = ?2) AS affiliation
       FROM member_identities mi
       WHERE mi.member_id NOT IN (SELECT source_member_id FROM identity_aliases)
       ORDER BY mi.last_submitted_at DESC`,
    )
    .bind(NAME_KEY, AFFILIATION_KEY)
    .all<IdentitySnapshotRow>();
  return results ?? [];
};

const fetchDismissedPairs = async (
  c: DbCtx,
): Promise<Set<string>> => {
  const { results } = await c.db
    .prepare(
      `SELECT source_member_id AS s, candidate_target_member_id AS t
       FROM identity_conflict_dismissals`,
    )
    .all<{ s: string; t: string }>();
  return new Set((results ?? []).map((r) => `${r.s}__${r.t}`));
};

const fetchLatestSyncJobIdForEmailConflict = async (
  c: DbCtx,
): Promise<string | null> => {
  const r = await c.db
    .prepare(
      `SELECT job_id AS jobId FROM sync_jobs
       WHERE error_json IS NOT NULL
         AND json_extract(error_json, '$.code') = 'EMAIL_CONFLICT'
       ORDER BY started_at DESC LIMIT 1`,
    )
    .first<{ jobId: string }>();
  return r?.jobId ?? null;
};

export async function listIdentityConflicts(
  c: DbCtx,
  cursor: string | null,
  limit: number,
): Promise<ListIdentityConflictsResponse> {
  const snapshots = await fetchIdentitySnapshots(c);
  const dismissed = await fetchDismissedPairs(c);
  const syncJobId = await fetchLatestSyncJobIdForEmailConflict(c);

  // detector は pure function。ここでは「全 identity を相互比較」する形に展開する。
  // source は新しい順 (lastSubmittedAt desc 先頭) を採用、target はそれより古い identity。
  const allWithFields = snapshots.filter(
    (s) => (s.name ?? "").trim() !== "" && (s.affiliation ?? "").trim() !== "",
  );

  const conflictRows = allWithFields.map((s) => ({
    sourceMemberId: s.memberId,
    name: s.name ?? "",
    affiliation: s.affiliation ?? "",
  }));
  const existing = allWithFields.map((s) => ({
    memberId: s.memberId,
    name: s.name ?? "",
    affiliation: s.affiliation ?? "",
  }));
  const candidates = detectConflictCandidates(conflictRows, existing);

  const lastSubmittedByMember = new Map(
    snapshots.map((s) => [s.memberId, s.lastSubmittedAt]),
  );
  const emailByMember = new Map(
    snapshots.map((s) => [s.memberId, s.responseEmail]),
  );

  // (source, target) を片方向に正規化（source = lastSubmittedAt が新しい側）。
  const seen = new Set<string>();
  const items: IdentityConflictRow[] = [];
  for (const cand of candidates) {
    let source = cand.sourceMemberId;
    let target = cand.candidateTargetMemberId;
    const sTime = lastSubmittedByMember.get(source) ?? "";
    const tTime = lastSubmittedByMember.get(target) ?? "";
    if (sTime < tTime) {
      // swap: 新しい方を source に揃える
      const tmp = source;
      source = target;
      target = tmp;
    }
    const key = `${source}__${target}`;
    if (seen.has(key)) continue;
    if (dismissed.has(key)) continue;
    seen.add(key);
    items.push({
      conflictId: key,
      sourceMemberId: source,
      candidateTargetMemberId: target,
      matchedFields: cand.matchedFields,
      detectedAt: lastSubmittedByMember.get(source) ?? new Date().toISOString(),
      responseEmailMasked: maskResponseEmail(emailByMember.get(source) ?? ""),
      syncJobId,
    });
  }

  // cursor pagination: detectedAt desc + conflictId asc
  items.sort((a, b) => {
    if (a.detectedAt !== b.detectedAt) return b.detectedAt.localeCompare(a.detectedAt);
    return a.conflictId.localeCompare(b.conflictId);
  });
  let start = 0;
  if (cursor) {
    const idx = items.findIndex((x) => x.conflictId === cursor);
    start = idx >= 0 ? idx + 1 : 0;
  }
  const sliced = items.slice(start, start + limit);
  const nextCursor =
    items.length > start + limit ? sliced[sliced.length - 1]!.conflictId : null;
  return { items: sliced, nextCursor };
}

export async function isConflictDismissed(
  c: DbCtx,
  source: string,
  target: string,
): Promise<boolean> {
  const r = await c.db
    .prepare(
      `SELECT 1 AS x FROM identity_conflict_dismissals
       WHERE source_member_id = ?1 AND candidate_target_member_id = ?2 LIMIT 1`,
    )
    .bind(source, target)
    .first<{ x: number }>();
  return r !== null;
}

export async function dismissIdentityConflict(
  c: DbCtx,
  source: string,
  target: string,
  actorAdminId: string,
  reason: string,
): Promise<{ dismissedAt: string }> {
  const dismissalId = crypto.randomUUID();
  const dismissedAt = new Date().toISOString();
  await c.db
    .prepare(
      `INSERT INTO identity_conflict_dismissals
        (dismissal_id, source_member_id, candidate_target_member_id,
         dismissed_by, reason, dismissed_at)
       VALUES (?1,?2,?3,?4,?5,?6)
       ON CONFLICT(source_member_id, candidate_target_member_id)
         DO UPDATE SET dismissed_by = excluded.dismissed_by,
                       reason = excluded.reason,
                       dismissed_at = excluded.dismissed_at`,
    )
    .bind(dismissalId, source, target, actorAdminId, redactIdentityReason(reason), dismissedAt)
    .run();
  return { dismissedAt };
}

export const parseConflictId = (
  conflictId: string,
): { source: string; target: string } | null => {
  const parts = conflictId.split("__");
  if (parts.length !== 2) return null;
  if (!parts[0] || !parts[1]) return null;
  return { source: parts[0], target: parts[1] };
};
