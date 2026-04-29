// GET /public/members use-case (04a)
// 公開フィルタ + tag AND filter + pagination + view 組成。
// 不変条件 #2 / #3 / #11 を view converter で fail close。

import type { DbCtx } from "../../repository/_shared/db";
import { listFieldsByResponseId } from "../../repository/responseFields";
import {
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
  "fullName",
  "nickname",
  "occupation",
  "location",
  "ubmZone",
  "ubmMembershipType",
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

  const [memberRows, total] = await Promise.all([
    listPublicMembers(ctx, repoInput),
    countPublicMembers(ctx, repoInput),
  ]);

  // 各 member の summary 用 field を 1 query / member で取得。
  // batch 化は MVP 数百規模で許容範囲（R-2: N+1 リスクは limit 100 で頭打ち）。
  const items: PublicMemberListItemSource[] = [];
  for (const m of memberRows) {
    const fields = await listFieldsByResponseId(
      ctx,
      m.current_response_id as never,
    );
    const byKey = new Map<string, string | null>();
    for (const f of fields) {
      if ((SUMMARY_KEYS as readonly string[]).includes(f.stable_key)) {
        byKey.set(f.stable_key, f.value_json);
      }
    }
    items.push({
      memberId: m.member_id,
      fullName: parseJsonString(byKey.get("fullName") ?? null),
      nickname: parseJsonString(byKey.get("nickname") ?? null),
      occupation: parseJsonString(byKey.get("occupation") ?? null),
      location: parseJsonString(byKey.get("location") ?? null),
      ubmZone: parseJsonNullable(byKey.get("ubmZone") ?? null),
      ubmMembershipType: parseJsonNullable(
        byKey.get("ubmMembershipType") ?? null,
      ),
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
    generatedAt: new Date().toISOString(),
  });
};
