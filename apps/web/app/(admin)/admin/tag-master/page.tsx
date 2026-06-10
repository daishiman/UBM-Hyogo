import { safeServerFetch } from "../../../../src/lib/admin/safe-server-fetch";
import { AdminPageHeader } from "../../../../src/features/admin/components/_layout/AdminPageHeader";
import { AdminSectionErrorClient } from "../../../../src/features/admin/components/_shared";
import { TagDefinitionPanel } from "../../../../src/components/admin/TagDefinitionPanel";
import {
  normalizeTagDefinitionList,
  type TagDefinitionListView,
} from "../../../../src/components/admin/tagDefinitionView";

export const dynamic = "force-dynamic";

export default async function AdminTagMasterPage() {
  const result = await safeServerFetch<TagDefinitionListView>(
    "/admin/tags?page=1&pageSize=100",
  );

  return (
    <section className="flex flex-col gap-4">
      <AdminPageHeader
        eyebrow="ADMIN / TAG DEFINITIONS"
        title="タグ定義"
        description="タグ定義の作成、編集、有効化、停止、完全削除を1画面で管理します。"
        breadcrumbs={[{ label: "管理", href: "/admin" }, { label: "タグ定義" }]}
      />
      {result.ok ? (
        <TagDefinitionPanel initial={normalizeTagDefinitionList(result.data)} />
      ) : (
        <AdminSectionErrorClient
          sectionLabel="タグ定義"
          code={result.error.code}
          message={result.error.message}
        />
      )}
    </section>
  );
}
