// issue-777: schema alias resolve 履歴閲覧 page
// 不変条件 #5: web は API helper 経由で audit endpoint を呼ぶ（D1 直接アクセスなし）
// 不変条件 #2 (OKLch): tokens.css 由来の色のみ使用
import type { ReactElement } from "react";
import { SchemaDiffHistoryPanel } from "../../../../../src/components/admin/SchemaDiffHistoryPanel";
import { AdminPageHeader } from "../../../../../src/features/admin/components/_layout/AdminPageHeader";

export const dynamic = "force-dynamic";

interface SearchParams {
  actorEmail?: string;
  from?: string;
  to?: string;
  questionTextLike?: string;
  cursor?: string;
}

export default async function SchemaHistoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<ReactElement> {
  const sp = await searchParams;
  return (
    <section className="flex flex-col gap-4">
      <AdminPageHeader
        eyebrow="ADMIN / SCHEMA"
        title="alias resolve 履歴"
        description="過去の解消結果を audit 経由で閲覧"
        breadcrumbs={[
          { label: "管理", href: "/admin" },
          { label: "Form schema", href: "/admin/schema" },
          { label: "履歴" },
        ]}
      />
      <SchemaDiffHistoryPanel
        initialFilters={{
          actorEmail: sp.actorEmail ?? "",
          from: sp.from ?? "",
          to: sp.to ?? "",
          questionTextLike: sp.questionTextLike ?? "",
        }}
        initialCursor={sp.cursor ?? null}
        showChrome={false}
      />
    </section>
  );
}
