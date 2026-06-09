import type { DbCtx } from "./_shared/db";
import type { MemberId, StableKey } from "./_shared/brand";

export interface MemberFieldOverrideRow {
  member_id: string;
  stable_key: string;
  value_json: string | null;
  raw_value_json: string | null;
  updated_by: string;
  updated_at: string;
}

export interface UpsertMemberFieldOverrideInput {
  memberId: MemberId;
  stableKey: StableKey;
  valueJson: string | null;
  rawValueJson?: string | null;
  updatedBy: string;
}

export async function listFieldOverridesByMemberId(
  c: DbCtx,
  memberId: MemberId,
): Promise<MemberFieldOverrideRow[]> {
  const result = await c.db
    .prepare(
      `SELECT member_id, stable_key, value_json, raw_value_json, updated_by, updated_at
         FROM member_field_overrides
        WHERE member_id = ?1
        ORDER BY stable_key ASC`,
    )
    .bind(memberId)
    .all<MemberFieldOverrideRow>();
  return result.results;
}

export async function listFieldOverridesByMemberIds(
  c: DbCtx,
  memberIds: readonly MemberId[],
): Promise<MemberFieldOverrideRow[]> {
  if (memberIds.length === 0) return [];
  const placeholders = memberIds.map((_, i) => `?${i + 1}`).join(", ");
  const result = await c.db
    .prepare(
      `SELECT member_id, stable_key, value_json, raw_value_json, updated_by, updated_at
         FROM member_field_overrides
        WHERE member_id IN (${placeholders})`,
    )
    .bind(...memberIds)
    .all<MemberFieldOverrideRow>();
  return result.results;
}

export async function upsertMemberFieldOverride(
  c: DbCtx,
  input: UpsertMemberFieldOverrideInput,
): Promise<void> {
  await c.db
    .prepare(
      `INSERT INTO member_field_overrides
        (member_id, stable_key, value_json, raw_value_json, updated_by, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))
       ON CONFLICT(member_id, stable_key) DO UPDATE SET
         value_json = excluded.value_json,
         raw_value_json = excluded.raw_value_json,
         updated_by = excluded.updated_by,
         updated_at = datetime('now')`,
    )
    .bind(
      input.memberId,
      input.stableKey,
      input.valueJson,
      input.rawValueJson ?? input.valueJson,
      input.updatedBy,
    )
    .run();
}
