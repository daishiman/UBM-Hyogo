// 06c: /admin/schema 差分解消画面
// 不変条件 #14: schema 解消はこの画面のみ
import Link from "next/link";
import { safeServerFetch } from "../../../../src/lib/admin/safe-server-fetch";
import { Breadcrumb } from "@/components/admin/Breadcrumb";
import { AdminSectionError } from "../../../../src/features/admin/components/_shared";
import { SchemaDiffPanel } from "../../../../src/components/admin/SchemaDiffPanel";
import type { SchemaDiffItem, SchemaDiffListView } from "../../../../src/components/admin/SchemaDiffPanel";

export const dynamic = "force-dynamic";

interface FormSection {
  sectionKey: string;
  title: string;
}

export default async function AdminSchemaPage() {
  const result = await safeServerFetch<SchemaDiffListView & { sections?: FormSection[] }>(
    "/admin/schema/diff",
  );
  const sections: FormSection[] =
    result.ok && result.data.sections && result.data.sections.length > 0
      ? result.data.sections
      : Array.from({ length: 6 }, (_, i) => ({
          sectionKey: `section-${i + 1}`,
          title: `セクション${i + 1}`,
        }));
  return (
    <>
      <Breadcrumb items={[{ label: "管理", href: "/admin" }, { label: "Form schema" }]} />
      <nav aria-label="schema sub navigation">
        <Link href="/admin/schema/history">resolve 履歴を見る</Link>
      </nav>
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
      {result.ok ? (
        <SchemaDiffPanel initial={result.data} />
      ) : (
        <AdminSectionError
          sectionLabel="Schema diff"
          code={result.error.code}
          message={result.error.message}
        />
      )}
    </>
  );
}

export type { SchemaDiffItem, SchemaDiffListView };
