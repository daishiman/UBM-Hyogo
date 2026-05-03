// 06c / 06c-B: /admin/members 一覧 (Server) + ドロワーは Client
// 12-search-tags: q / zone / tag(repeated) / sort / density / page を URL 正本として扱う。
// AC-1: profile 本文 input/textarea を出さない
// AC-2: tag 編集は /admin/tags?memberId への Link のみ
// AC-9: 管理メモはドロワー内のみ
import type { AdminMemberListView } from "@ubm-hyogo/shared";
import {
  toAdminApiQuery,
  ADMIN_FILTER_VALUES,
  ADMIN_SORT_VALUES,
  ADMIN_DENSITY_VALUES,
  ADMIN_ZONE_VALUES,
  ADMIN_SEARCH_LIMITS,
  type AdminMemberSearch,
} from "@ubm-hyogo/shared";
import { fetchAdmin } from "../../../../src/lib/admin/server-fetch";
import { MembersClient } from "../../../../src/components/admin/MembersClient";

export const dynamic = "force-dynamic";

const oneOf = <T extends readonly string[]>(
  v: string | undefined,
  values: T,
): T[number] | undefined => (values as readonly string[]).includes(v ?? "") ? (v as T[number]) : undefined;

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (k: string): string | undefined => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const tagRaw = sp["tag"];
  const tag = Array.isArray(tagRaw)
    ? tagRaw.filter((t): t is string => typeof t === "string" && t.length > 0)
    : typeof tagRaw === "string" && tagRaw.length > 0
      ? [tagRaw]
      : [];

  const filter = oneOf(get("filter"), ADMIN_FILTER_VALUES) ?? "";
  const zone = oneOf(get("zone"), ADMIN_ZONE_VALUES) ?? "all";
  const sort = oneOf(get("sort"), ADMIN_SORT_VALUES) ?? "recent";
  const density = oneOf(get("density"), ADMIN_DENSITY_VALUES) ?? "comfy";
  const qRaw = get("q") ?? "";
  const q = qRaw.trim().replace(/\s+/g, " ").slice(0, ADMIN_SEARCH_LIMITS.Q_LIMIT);
  const pageNum = Number(get("page") ?? "1");
  const page = Number.isFinite(pageNum) && pageNum >= 1 ? Math.floor(pageNum) : 1;

  const search: AdminMemberSearch = {
    filter,
    q,
    zone,
    tag: tag.slice(0, ADMIN_SEARCH_LIMITS.TAG_LIMIT),
    sort,
    density,
    page,
  };

  const params = toAdminApiQuery(search);
  const qs = params.toString();
  const initial = await fetchAdmin<AdminMemberListView>(
    `/admin/members${qs ? `?${qs}` : ""}`,
  );
  return <MembersClient initial={initial} search={search} />;
}
