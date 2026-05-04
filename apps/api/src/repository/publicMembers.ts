// 公開メンバー専用 repository (04a)
// 公開フィルタ + tag AND filter + pagination を 1 query 内で適用する。
// 不変条件 #2 (consent キー), #11 (admin 分離), #5 (D1 access は apps/api 内のみ)
//
// 検索対象は member_responses.search_text (03b sync 時に searchable=1 の field の
// value を concat 済み)。SQL injection は prepared statement で防御。

import type { DbCtx } from "./_shared/db";
import { placeholders } from "./_shared/sql";
import { STABLE_KEY } from "@ubm-hyogo/shared";

export interface PublicMemberRow {
  member_id: string;
  current_response_id: string;
  last_submitted_at: string;
}

export interface ListPublicMembersInput {
  readonly q: string;
  readonly zone: string;
  readonly status: string;
  readonly tagCodes: readonly string[];
  readonly sort: "recent" | "name";
  readonly page: number;
  readonly limit: number;
}

const buildBaseFromWhere = (input: ListPublicMembersInput): {
  fromWhere: string;
  binds: unknown[];
} => {
  const binds: unknown[] = [];
  let fromWhere =
    `FROM member_identities mi
       JOIN member_status s ON s.member_id = mi.member_id
       JOIN member_responses r ON r.response_id = mi.current_response_id
      WHERE s.public_consent = 'consented'
        AND s.publish_state = 'public'
        AND s.is_deleted = 0
        AND mi.member_id NOT IN (SELECT source_member_id FROM identity_aliases)`;

  if (input.q) {
    fromWhere += ` AND r.search_text LIKE ?`;
    binds.push(`%${input.q}%`);
  }

  if (input.zone !== "all") {
    fromWhere += `
      AND EXISTS (
        SELECT 1 FROM response_fields rf_zone
        WHERE rf_zone.response_id = mi.current_response_id
          AND rf_zone.stable_key = '${STABLE_KEY.ubmZone}'
          AND rf_zone.value_json = ?
      )`;
    binds.push(JSON.stringify(input.zone));
  }

  if (input.status !== "all") {
    fromWhere += `
      AND EXISTS (
        SELECT 1 FROM response_fields rf_status
        WHERE rf_status.response_id = mi.current_response_id
          AND rf_status.stable_key = '${STABLE_KEY.ubmMembershipType}'
          AND rf_status.value_json = ?
      )`;
    binds.push(JSON.stringify(input.status));
  }

  if (input.tagCodes.length > 0) {
    const ph = placeholders(input.tagCodes.length);
    fromWhere += `
      AND mi.member_id IN (
        SELECT mt.member_id FROM member_tags mt
        JOIN tag_definitions td ON td.tag_id = mt.tag_id
        WHERE td.code IN (${ph})
        GROUP BY mt.member_id
        HAVING COUNT(DISTINCT td.code) = ?
      )`;
    binds.push(...input.tagCodes, input.tagCodes.length);
  }

  return { fromWhere, binds };
};

export async function countPublicMembers(
  c: DbCtx,
  input: ListPublicMembersInput,
): Promise<number> {
  const { fromWhere, binds } = buildBaseFromWhere(input);
  const r = await c.db
    .prepare(`SELECT COUNT(DISTINCT mi.member_id) AS cnt ${fromWhere}`)
    .bind(...binds)
    .first<{ cnt: number }>();
  return r?.cnt ?? 0;
}

export async function listPublicMembers(
  c: DbCtx,
  input: ListPublicMembersInput,
): Promise<PublicMemberRow[]> {
  const { fromWhere, binds } = buildBaseFromWhere(input);
  const orderBy =
    input.sort === "name"
      ? "ORDER BY mi.member_id ASC"
      : "ORDER BY mi.last_submitted_at DESC, mi.member_id ASC";
  const offset = Math.max(0, (input.page - 1) * input.limit);
  const sql = `SELECT mi.member_id, mi.current_response_id, mi.last_submitted_at
               ${fromWhere}
               GROUP BY mi.member_id
               ${orderBy}
               LIMIT ? OFFSET ?`;
  const r = await c.db
    .prepare(sql)
    .bind(...binds, input.limit, offset)
    .all<PublicMemberRow>();
  return r.results ?? [];
}

/**
 * 公開フィルタを通る member が存在するかを EXISTS チェックする。
 * 0 件なら use-case 側で 404 を投げる (AC-4)。
 */
export async function existsPublicMember(
  c: DbCtx,
  memberId: string,
): Promise<boolean> {
  const r = await c.db
    .prepare(
      `SELECT 1 AS hit FROM member_status s
        JOIN member_identities mi ON mi.member_id = s.member_id
        WHERE s.member_id = ?
          AND s.public_consent = 'consented'
          AND s.publish_state = 'public'
          AND s.is_deleted = 0
          AND mi.member_id NOT IN (SELECT source_member_id FROM identity_aliases)
        LIMIT 1`,
    )
    .bind(memberId)
    .first<{ hit: number }>();
  return r !== null;
}

export interface ZoneCountRow {
  ubm_zone: string | null;
  count: number;
}

export interface MembershipCountRow {
  ubm_membership_type: string | null;
  count: number;
}

const ZONE_STABLE_KEY = STABLE_KEY.ubmZone;
const MEMBERSHIP_STABLE_KEY = STABLE_KEY.ubmMembershipType;

/**
 * stableKey 別 (ubmZone / ubmMembershipType) の値を集計する。
 * response_fields.value_json から JSON 値を取り出して GROUP BY する。
 */
const aggregateByStableKey = async (
  c: DbCtx,
  stableKey: string,
): Promise<Array<{ value: string | null; count: number }>> => {
  const r = await c.db
    .prepare(
      `SELECT rf.value_json AS value, COUNT(*) AS cnt
         FROM member_identities mi
         JOIN member_status s ON s.member_id = mi.member_id
         JOIN response_fields rf ON rf.response_id = mi.current_response_id
        WHERE s.public_consent = 'consented'
          AND s.publish_state = 'public'
          AND s.is_deleted = 0
          AND mi.member_id NOT IN (SELECT source_member_id FROM identity_aliases)
          AND rf.stable_key = ?
        GROUP BY rf.value_json`,
    )
    .bind(stableKey)
    .all<{ value: string | null; cnt: number }>();
  return (r.results ?? []).map((row) => ({
    value: row.value,
    count: row.cnt,
  }));
};

const stripJsonString = (raw: string | null): string | null => {
  if (raw === null) return null;
  try {
    const v = JSON.parse(raw);
    return typeof v === "string" ? v : null;
  } catch {
    return null;
  }
};

export async function countAllPublicMembers(c: DbCtx): Promise<number> {
  const r = await c.db
    .prepare(
      `SELECT COUNT(*) AS cnt FROM member_status s
        JOIN member_identities mi ON mi.member_id = s.member_id
        WHERE s.public_consent = 'consented'
          AND s.publish_state = 'public'
          AND s.is_deleted = 0
          AND mi.member_id NOT IN (SELECT source_member_id FROM identity_aliases)`,
    )
    .first<{ cnt: number }>();
  return r?.cnt ?? 0;
}

export async function countAllMembers(c: DbCtx): Promise<number> {
  const r = await c.db
    .prepare(
      `SELECT COUNT(*) AS cnt FROM member_identities
        WHERE member_id NOT IN (SELECT source_member_id FROM identity_aliases)`,
    )
    .first<{ cnt: number }>();
  return r?.cnt ?? 0;
}

export async function aggregatePublicZones(
  c: DbCtx,
): Promise<Array<{ zone: string; count: number }>> {
  const rows = await aggregateByStableKey(c, ZONE_STABLE_KEY);
  return rows
    .map((r) => ({ zone: stripJsonString(r.value) ?? "unknown", count: r.count }))
    .sort((a, b) => b.count - a.count);
}

export async function aggregatePublicMemberships(
  c: DbCtx,
): Promise<Array<{ type: string; count: number }>> {
  const rows = await aggregateByStableKey(c, MEMBERSHIP_STABLE_KEY);
  return rows
    .map((r) => ({ type: stripJsonString(r.value) ?? "unknown", count: r.count }))
    .sort((a, b) => b.count - a.count);
}
