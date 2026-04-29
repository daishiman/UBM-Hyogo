// 04c admin route 共通の bindings 型と helper
import type { AdminGateEnv } from "../../middleware/admin-gate";
import type { RequireAuthEnv } from "../../middleware/require-admin";

export interface AdminRouteEnv extends AdminGateEnv, RequireAuthEnv {
  readonly DB: D1Database;
}

// ISO8601 with offset を保証する。Date#toISOString() は 'Z' を返すが
// zod datetime({ offset: true }) は 'Z' も許容するためそのまま OK。
export const nowIso = (): string => new Date().toISOString();

// submitted_at などレガシーな `2026-01-01T00:00:00Z` 形式は zod 通過する。
// SQLite datetime('now') が返す `2026-01-01 00:00:00` 形式は通らないので
// 必要箇所ではこのヘルパーで補正する。
export const normalizeIso = (s: string): string => {
  if (s.includes("T")) return s.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(s) ? s : `${s}Z`;
  // SQL datetime('now') 形式 'YYYY-MM-DD HH:MM:SS' → ISO 化
  return `${s.replace(" ", "T")}Z`;
};

export const memberExists = async (
  db: D1Database,
  memberId: string,
): Promise<boolean> => {
  const row = await db
    .prepare("SELECT 1 AS found FROM member_identities WHERE member_id = ?1")
    .bind(memberId)
    .first<{ found: number }>();
  return row !== null;
};
