// GET /public/members use-case (04a)
// 公開フィルタ + tag AND filter + pagination + view 組成。
// 不変条件 #2 / #3 / #11 を view converter で fail close。

import type { DbCtx } from "../../repository/_shared/db";
import { STABLE_KEY, asMemberId, asResponseId } from "@ubm-hyogo/shared";
import { listFieldsByResponseIds } from "../../repository/responseFields";
import { listTagsByMemberIds } from "../../repository/memberTags";
import {
  aggregateTopTags,
  countPublicMembers,
  listPublicMembers,
} from "../../repository/publicMembers";
import { buildPaginationMeta } from "../../_shared/pagination";
import type { ParsedPublicMemberQuery } from "../../_shared/search-query-parser";
import {
  toPublicMemberListView,
  type PublicMemberListItemSource,
  type PublicMemberListResponse,
} from "../../view-models/public/public-member-list-view";

export interface ListPublicMembersDeps {
  ctx: DbCtx;
}

const SUMMARY_KEYS = [
  STABLE_KEY.fullName,
  STABLE_KEY.nickname,
  STABLE_KEY.occupation,
  STABLE_KEY.location,
  STABLE_KEY.ubmZone,
  STABLE_KEY.ubmMembershipType,
] as const;

const parseJsonString = (raw: string | null): string => {
  if (raw === null) return "";
  try {
    const v = JSON.parse(raw);
    return typeof v === "string" ? v : "";
  } catch {
    return "";
  }
};

const parseJsonNullable = (raw: string | null): string | null => {
  if (raw === null) return null;
  try {
    const v = JSON.parse(raw);
    return typeof v === "string" && v.length > 0 ? v : null;
  } catch {
    return null;
  }
};

export const listPublicMembersUseCase = async (
  query: ParsedPublicMemberQuery,
  deps: ListPublicMembersDeps,
): Promise<PublicMemberListResponse> => {
  const { ctx } = deps;
  const repoInput = {
    q: query.q,
    zone: query.zone,
    status: query.status,
    tagCodes: query.tags,
    sort: query.sort,
    page: query.page,
    limit: query.limit,
  };

  const [memberRows, total, topTags] = await Promise.all([
    listPublicMembers(ctx, repoInput),
    countPublicMembers(ctx, repoInput),
    aggregateTopTags(ctx),
  ]);

  // issue-224: expand=tags のときだけ tags を `member_id IN (...)` の 1 batch query で取得し、
  // member_id でキー化した Map に groupBy する（N+1 防止）。
  const wantTags = query.expand.includes("tags");
  let tagsByMember:
    | Map<string, { code: string; label: string; category: string }[]>
    | undefined;
  if (wantTags && memberRows.length > 0) {
    const memberIds = memberRows.map((m) => asMemberId(m.member_id));
    const tagRows = await listTagsByMemberIds(ctx, memberIds); // 1 query・フラット配列
    tagsByMember = new Map();
    for (const r of tagRows) {
      const arr = tagsByMember.get(r.member_id) ?? [];
      // 公開レスポンスは code/label/category のみ（confidence/source 等は載せない）。
      arr.push({ code: r.code, label: r.label, category: r.category });
      tagsByMember.set(r.member_id, arr);
    }
  }

  // summary 用 field も response_id IN (...) の 1 batch query で取得する。
  const responseIds = memberRows.map((m) =>
    asResponseId(m.current_response_id),
  );
  const fieldRows =
    responseIds.length > 0 ? await listFieldsByResponseIds(ctx, responseIds) : [];
  const fieldsByResponseId = new Map<string, Map<string, string | null>>();
  for (const f of fieldRows) {
    if (!(SUMMARY_KEYS as readonly string[]).includes(f.stable_key)) continue;
    const fields = fieldsByResponseId.get(f.response_id) ?? new Map();
    fields.set(f.stable_key, f.value_json);
    fieldsByResponseId.set(f.response_id, fields);
  }

  const items: PublicMemberListItemSource[] = [];
  for (const m of memberRows) {
    const byKey = fieldsByResponseId.get(m.current_response_id) ?? new Map();
    items.push({
      memberId: m.member_id,
      fullName: parseJsonString(byKey.get(STABLE_KEY.fullName) ?? null),
      nickname: parseJsonString(byKey.get(STABLE_KEY.nickname) ?? null),
      occupation: parseJsonString(byKey.get(STABLE_KEY.occupation) ?? null),
      location: parseJsonString(byKey.get(STABLE_KEY.location) ?? null),
      ubmZone: parseJsonNullable(byKey.get(STABLE_KEY.ubmZone) ?? null),
      ubmMembershipType: parseJsonNullable(
        byKey.get(STABLE_KEY.ubmMembershipType) ?? null,
      ),
      // wantTags のときだけ tags を付与（未登録 member は空配列）。
      ...(wantTags ? { tags: tagsByMember?.get(m.member_id) ?? [] } : {}),
    });
  }

  const pagination = buildPaginationMeta(total, query.page, query.limit);

  return toPublicMemberListView({
    items,
    pagination,
    appliedQuery: {
      q: query.q,
      zone: query.zone,
      status: query.status,
      tags: query.tags,
      sort: query.sort,
      density: query.density,
    },
    topTags,
    generatedAt: new Date().toISOString(),
  });
};
