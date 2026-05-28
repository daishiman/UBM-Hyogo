// serial-05: /(admin)/admin/schema — blueprint 09g:521-640
// 06c: /admin/schema 差分解消画面
// 不変条件 #14: schema 解消はこの画面のみ
import Link from "next/link";
import { safeServerFetch } from "../../../../src/lib/admin/safe-server-fetch";
import { AdminSectionErrorClient } from "../../../../src/features/admin/components/_shared";
import { AdminPageHeader } from "../../../../src/features/admin/components/_layout/AdminPageHeader";
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
    <section className="flex flex-col gap-4" aria-labelledby="schema-form-h">
      <AdminPageHeader
        eyebrow="ADMIN / SCHEMA"
        title="スキーマ差分のレビュー"
        description="Google Form の最新 schema との差分を解消する"
        breadcrumbs={[{ label: "管理", href: "/admin" }, { label: "Form schema" }]}
        headingId="schema-form-h"
        actions={
          <Link
            href="/admin/schema/history"
            className="text-sm text-[var(--ubm-color-link-default)] underline-offset-2 hover:underline"
          >
            resolve 履歴を見る
          </Link>
        }
      />
      <section aria-label="Form schema sections">
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
        <AdminSectionErrorClient
          sectionLabel="Schema diff"
          code={result.error.code}
          message={result.error.message}
        />
      )}
    </section>
  );
}

export type { SchemaDiffItem, SchemaDiffListView };
