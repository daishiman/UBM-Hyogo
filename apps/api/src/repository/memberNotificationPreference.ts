// Issue #55: member_status.notification_opt_out 専用 repository
//
// 不変条件 #5: D1 アクセスは apps/api 内に閉じる。
// 不変条件 #11: admin が member_status を更新する場合は本 setter を経由する。

import type { DbCtx } from "./_shared/db";

export const loadNotificationOptOut = async (
  c: DbCtx,
  memberId: string,
): Promise<boolean> => {
  const row = await c.db
    .prepare(
      `SELECT notification_opt_out AS optOut
         FROM member_status
        WHERE member_id = ?1`,
    )
    .bind(memberId)
    .first<{ optOut: number | null }>();
  return Number(row?.optOut ?? 0) === 1;
};

export interface UpdateNotificationOptOutInput {
  memberId: string;
  notificationOptOut: boolean;
  updatedBy: string;
  updatedAt: string;
}

/**
 * member_status 行が存在しない member への PATCH は upsert で扱う
 * (response sync 前の member は status 行を持たない可能性があるため)。
 * 戻り値: 反映後の notification_opt_out 値 (boolean)。
 */
export const updateNotificationOptOut = async (
  c: DbCtx,
  input: UpdateNotificationOptOutInput,
): Promise<boolean> => {
  const value = input.notificationOptOut ? 1 : 0;
  await c.db
    .prepare(
      `INSERT INTO member_status (member_id, notification_opt_out, updated_by, updated_at)
       VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(member_id) DO UPDATE SET
         notification_opt_out = excluded.notification_opt_out,
         updated_by = excluded.updated_by,
         updated_at = excluded.updated_at`,
    )
    .bind(input.memberId, value, input.updatedBy, input.updatedAt)
    .run();
  return input.notificationOptOut;
};
