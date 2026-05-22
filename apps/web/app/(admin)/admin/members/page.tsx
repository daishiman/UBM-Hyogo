// task-15: /admin/members 一覧 (Server) + Client shell
// 12-search-tags: q / zone / filter / sort / page を URL 正本として扱う。
// AC-1: profile 本文 input/textarea を出さない（drawer は read-only）
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
import {
  AdminPageHeader,
  MembersClientShell,
} from "../../../../src/features/admin/components";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const oneOf = <T extends readonly string[]>(
  v: string | undefined,
  values: T,
): T[number] | undefined =>
  (values as readonly string[]).includes(v ?? "") ? (v as T[number]) : undefined;

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
    tag: [],
    sort,
    density,
    page,
  };

  const params = toAdminApiQuery(search);
  const qs = params.toString();
  const initial = await fetchAdmin<AdminMemberListView>(
    `/admin/members${qs ? `?${qs}` : ""}`,
  );

  return (
    <section aria-labelledby="admin-members-h" className="flex flex-col gap-4">
      <AdminPageHeader
        title="会員管理"
        description={`${initial.total} 件の会員`}
        breadcrumbs={[{ label: "管理", href: "/admin" }, { label: "会員管理" }]}
        actions={
          <button
            type="button"
            disabled
            title="MVP 範囲外"
            aria-disabled="true"
            className="rounded border border-[var(--ubm-color-border-default)] px-3 py-1 text-sm text-[var(--ubm-color-text-muted)] opacity-50"
          >
            CSV エクスポート
          </button>
        }
      />
      <h1 id="admin-members-h" className="sr-only">
        会員管理
      </h1>
      <MembersClientShell
        initial={initial}
        initialFilter={{ q, zone, filter, sort: sort as "recent" | "name" | "publish_state" }}
        page={page}
        pageSize={initial.pageSize ?? PAGE_SIZE}
      />
    </section>
  );
}
