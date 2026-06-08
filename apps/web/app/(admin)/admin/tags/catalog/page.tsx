import { AdminPageHeader } from "../../../../../src/features/admin/components/_layout/AdminPageHeader";
import { AdminSectionErrorClient } from "../../../../../src/features/admin/components/_shared";
import { safeServerFetch } from "../../../../../src/lib/admin/safe-server-fetch";
import {
  TagCatalogPanel,
  type TagCatalogListView,
} from "../../../../../src/components/admin/TagCatalogPanel";

export const dynamic = "force-dynamic";

const toPositiveInt = (value: string | undefined, fallback: number, max?: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return max ? Math.min(parsed, max) : parsed;
};

export default async function AdminTagCatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 120) : "";
  const page = toPositiveInt(sp.page, 1);
  const pageSize = toPositiveInt(sp.pageSize, 50, 100);
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (q) query.set("q", q);
  const result = await safeServerFetch<TagCatalogListView>(
    `/admin/tags?${query.toString()}`,
  );

  return (
    <section className="flex flex-col gap-4">
      <AdminPageHeader
        eyebrow="ADMIN / TAG CATALOG"
        title="タグカタログ"
        description="タグ定義の有効化、論理削除、完全削除を管理します。"
        breadcrumbs={[
          { label: "管理", href: "/admin" },
          { label: "タグキュー", href: "/admin/tags" },
          { label: "タグカタログ" },
        ]}
      />
      {result.ok ? (
        <TagCatalogPanel
          initial={result.data}
          query={q}
          page={page}
          pageSize={pageSize}
        />
      ) : (
        <AdminSectionErrorClient
          sectionLabel="タグカタログ"
          code={result.error.code}
          message={result.error.message}
        />
      )}
    </section>
  );
}
