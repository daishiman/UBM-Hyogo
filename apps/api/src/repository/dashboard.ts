// dashboard 集計用 repository（04c）
// AdminDashboardView の totals + recentSubmissions + schemaState を 1 ファイルに集約。
import type { DbCtx } from "./_shared/db";

export interface DashboardTotals {
  members: number;
  pendingConsent: number;
  deletedMembers: number;
  queuedTagAssignments: number;
}

export interface DashboardRecentSubmission {
  responseId: string;
  memberId: string | null;
  submittedAt: string;
  fullName: string;
}

export type DashboardSchemaState = "active" | "superseded" | "pending_review";

const countOne = async (c: DbCtx, sql: string): Promise<number> => {
  const r = await c.db.prepare(sql).first<{ n: number }>();
  return r?.n ?? 0;
};

export async function getTotals(c: DbCtx): Promise<DashboardTotals> {
  const [members, pendingConsent, deletedMembers, queuedTagAssignments] =
    await Promise.all([
      countOne(c, "SELECT COUNT(*) AS n FROM member_identities"),
      countOne(
        c,
        "SELECT COUNT(*) AS n FROM member_status WHERE rules_consent != 'consented' OR public_consent != 'consented'",
      ),
      countOne(
        c,
        "SELECT COUNT(*) AS n FROM member_status WHERE is_deleted = 1",
      ),
      countOne(
        c,
        "SELECT COUNT(*) AS n FROM tag_assignment_queue WHERE status = 'queued'",
      ),
    ]);
  return { members, pendingConsent, deletedMembers, queuedTagAssignments };
}

interface RecentSubmissionRow {
  response_id: string;
  member_id: string | null;
  submitted_at: string;
  answers_json: string | null;
}

export async function listRecentSubmissions(
  c: DbCtx,
  limit: number,
): Promise<DashboardRecentSubmission[]> {
  const r = await c.db
    .prepare(
      `SELECT mr.response_id, mi.member_id AS member_id, mr.submitted_at, mr.answers_json
       FROM member_responses mr
       LEFT JOIN member_identities mi ON mi.current_response_id = mr.response_id
       ORDER BY mr.submitted_at DESC
       LIMIT ?1`,
    )
    .bind(limit)
    .all<RecentSubmissionRow>();
  return (r.results ?? []).map((row) => {
    let fullName = "";
    if (row.answers_json) {
      try {
        const parsed = JSON.parse(row.answers_json) as Record<string, unknown>;
        const fn = parsed["fullName"];
        if (typeof fn === "string") fullName = fn;
      } catch {
        // ignore
      }
    }
    return {
      responseId: row.response_id,
      memberId: row.member_id,
      submittedAt: row.submitted_at,
      fullName,
    };
  });
}

export async function getCurrentSchemaState(
  c: DbCtx,
): Promise<DashboardSchemaState> {
  const r = await c.db
    .prepare(
      "SELECT state FROM schema_versions ORDER BY synced_at DESC LIMIT 1",
    )
    .first<{ state: string }>();
  if (!r) return "pending_review";
  const s = r.state;
  if (s === "active" || s === "superseded" || s === "pending_review") return s;
  return "pending_review";
}
