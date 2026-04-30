// 06c: /admin/schema 差分解消画面
// 不変条件 #14: schema 解消はこの画面のみ
import { fetchAdmin } from "../../../../src/lib/admin/server-fetch";
import { SchemaDiffPanel } from "../../../../src/components/admin/SchemaDiffPanel";
import type { SchemaDiffItem, SchemaDiffListView } from "../../../../src/components/admin/SchemaDiffPanel";

export const dynamic = "force-dynamic";

export default async function AdminSchemaPage() {
  const data = await fetchAdmin<SchemaDiffListView>("/admin/schema/diff");
  return <SchemaDiffPanel initial={data} />;
}

export type { SchemaDiffItem, SchemaDiffListView };
