import { safeServerFetch } from "../../../../src/lib/admin/safe-server-fetch";
import { AdminPageHeader } from "../../../../src/features/admin/components/_layout/AdminPageHeader";
import { AdminSectionErrorClient } from "../../../../src/features/admin/components/_shared";
import { TagMasterPanel } from "../../../../src/features/admin/components/_tags/TagMasterPanel";
import type { AdminTagRef } from "../../../../src/features/admin/api/tags";

export const dynamic = "force-dynamic";

type AdminTagsPageResponse = {
  readonly total?: number;
  readonly items?: readonly AdminTagRef[];
};

export default async function AdminTagMasterPage() {
  const result = await safeServerFetch<AdminTagsPageResponse>("/admin/tags?page=1&pageSize=100");

  return (
    <section className="flex flex-col gap-4">
      <AdminPageHeader
        eyebrow="ADMIN / TAG MASTER"
        title="タグ管理"
        description="タグ master の code、表示名、カテゴリを安全に編集します。"
        breadcrumbs={[{ label: "管理", href: "/admin" }, { label: "タグ管理" }]}
      />
      {result.ok ? (
        <TagMasterPanel
          initialTags={result.data.items ?? []}
          total={result.data.total ?? result.data.items?.length ?? 0}
        />
      ) : (
        <AdminSectionErrorClient
          sectionLabel="タグ管理"
          code={result.error.code}
          message={result.error.message}
        />
      )}
    </section>
  );
}
