// 06c: /admin/schema 差分解消画面
// 不変条件 #14: schema 解消はこの画面のみ
import { fetchAdmin } from "../../../../src/lib/admin/server-fetch";
import { SchemaDiffPanel } from "../../../../src/components/admin/SchemaDiffPanel";
import type { SchemaDiffItem, SchemaDiffListView } from "../../../../src/components/admin/SchemaDiffPanel";

export const dynamic = "force-dynamic";

interface FormSection {
  sectionKey: string;
  title: string;
}

export default async function AdminSchemaPage() {
  const data = await fetchAdmin<SchemaDiffListView & { sections?: FormSection[] }>(
    "/admin/schema/diff",
  );
  // Google Form 6 セクション（不変条件: sectionCount=6）の overview 一覧
  const sections: FormSection[] =
    data.sections && data.sections.length > 0
      ? data.sections
      : Array.from({ length: 6 }, (_, i) => ({
          sectionKey: `section-${i + 1}`,
          title: `セクション${i + 1}`,
        }));
  return (
    <>
      <section aria-labelledby="schema-form-h">
        <h1 id="schema-form-h">Form schema 概要</h1>
        <ul>
          {sections.map((s) => (
            <li key={s.sectionKey} data-testid="admin-schema-section">
              {s.title}
            </li>
          ))}
        </ul>
      </section>
      <SchemaDiffPanel initial={data} />
    </>
  );
}

export type { SchemaDiffItem, SchemaDiffListView };
