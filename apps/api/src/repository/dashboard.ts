// dashboard 集計用 repository（06c-A）
// AdminDashboardView の totals (KPI 4) + recentActions を 1 ファイルに集約。
import type { DbCtx } from "./_shared/db";

export interface DashboardTotals {
  totalMembers: number;
  publicMembers: number;
  untaggedMembers: number;
  unresolvedSchema: number;
}

export interface DashboardRecentAction {
  auditId: string;
  actorEmail: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  createdAt: string;
}

const countOne = async (c: DbCtx, sql: string): Promise<number> => {
  const r = await c.db.prepare(sql).first<{ n: number }>();
  return r?.n ?? 0;
};

export async function getTotals(c: DbCtx): Promise<DashboardTotals> {
  const [totalMembers, publicMembers, untaggedMembers, unresolvedSchema] =
    await Promise.all([
      countOne(c, "SELECT COUNT(*) AS n FROM member_identities"),
      countOne(
        c,
        "SELECT COUNT(*) AS n FROM member_status WHERE publish_state = 'public' AND is_deleted = 0",
      ),
      countOne(
        c,
        `SELECT COUNT(*) AS n FROM member_identities mi
         LEFT JOIN member_tags mt ON mt.member_id = mi.member_id
         WHERE mt.member_id IS NULL`,
      ),
      countOne(
        c,
        "SELECT COUNT(*) AS n FROM schema_diff_queue WHERE status != 'resolved'",
      ),
    ]);
  return { totalMembers, publicMembers, untaggedMembers, unresolvedSchema };
}

interface RecentActionRow {
  audit_id: string;
  actor_email: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  created_at: string;
}

export async function listRecentActions(
  c: DbCtx,
  limit: number,
): Promise<DashboardRecentAction[]> {
  const r = await c.db
    .prepare(
      `SELECT audit_id, actor_email, action, target_type, target_id, created_at
       FROM audit_log
       WHERE created_at >= datetime('now','-7 days')
         AND action != 'dashboard.view'
       ORDER BY created_at DESC
       LIMIT ?1`,
    )
    .bind(limit)
    .all<RecentActionRow>();
  return (r.results ?? []).map((row) => ({
    auditId: row.audit_id,
    actorEmail: row.actor_email,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    createdAt: row.created_at,
  }));
}
