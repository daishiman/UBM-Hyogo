// issue-777: schema alias resolve 履歴閲覧 page
// 不変条件 #5: web は API helper 経由で audit endpoint を呼ぶ（D1 直接アクセスなし）
// 不変条件 #2 (OKLch): tokens.css 由来の色のみ使用
import type { ReactElement } from "react";
import { SchemaDiffHistoryPanel } from "../../../../../src/components/admin/SchemaDiffHistoryPanel";

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
    <SchemaDiffHistoryPanel
      initialFilters={{
        actorEmail: sp.actorEmail ?? "",
        from: sp.from ?? "",
        to: sp.to ?? "",
        questionTextLike: sp.questionTextLike ?? "",
      }}
      initialCursor={sp.cursor ?? null}
    />
  );
}
