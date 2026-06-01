// GET /public/members use-case (04a)
// 公開フィルタ + tag AND filter + pagination + view 組成。
// 不変条件 #2 / #3 / #11 を view converter で fail close。

import type { DbCtx } from "../../repository/_shared/db";
import { STABLE_KEY } from "@ubm-hyogo/shared";
import { listFieldsByResponseId } from "../../repository/responseFields";
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
  // issue-1029: 公開 gate 通過 member の memberId 群から presigned photoUrl を解決する optional resolver。
  // route 層が R2 presign batch を構築して DI する。未注入時は photoUrl を付けない（後方互換 / fail-soft）。
  resolvePhotoUrls?: (memberIds: string[]) => Promise<Map<string, string>>;
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

  // issue-1029: 抽出済み memberId 群で photoUrl を 1 回だけ batch 解決する（N+1 防止）。
  // resolver 未注入時は空 Map のため全 item photoUrl undefined（後方互換 / fail-soft）。
  const memberIds = memberRows.map((m) => m.member_id);
  const photoMap = deps.resolvePhotoUrls
    ? await deps.resolvePhotoUrls(memberIds)
    : new Map<string, string>();

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
      fullName: parseJsonString(byKey.get(STABLE_KEY.fullName) ?? null),
      nickname: parseJsonString(byKey.get(STABLE_KEY.nickname) ?? null),
      occupation: parseJsonString(byKey.get(STABLE_KEY.occupation) ?? null),
      location: parseJsonString(byKey.get(STABLE_KEY.location) ?? null),
      ubmZone: parseJsonNullable(byKey.get(STABLE_KEY.ubmZone) ?? null),
      ubmMembershipType: parseJsonNullable(
        byKey.get(STABLE_KEY.ubmMembershipType) ?? null,
      ),
      photoUrl: photoMap.get(m.member_id),
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
