// serial-05: /(admin)/admin/identity-conflicts — blueprint 09g:741-840
// issue-194-03b-followup-001-email-conflict-identity-merge
// admin identity-conflicts list page
//   - admin gate は (admin)/layout.tsx で済 / API 呼び出しは fetchAdmin proxy
//   - 不変条件 #3: responseEmail は API 側で既に部分マスク済 (raw email を表示しない)
//   - 不変条件 #5: D1 直接アクセスなし
import Link from "next/link";
import { safeServerFetch } from "../../../../src/lib/admin/safe-server-fetch";
import {
  AdminEmptyState,
  AdminSectionCard,
  AdminSectionErrorClient,
} from "../../../../src/features/admin/components/_shared";
import { AdminPageHeader } from "../../../../src/features/admin/components/_layout/AdminPageHeader";
import type { ListIdentityConflictsResponse } from "@ubm-hyogo/shared";
import { IdentityConflictRow } from "../../../../src/components/admin/IdentityConflictRow";

export const dynamic = "force-dynamic";

const toSingle = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export default async function AdminIdentityConflictsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const cursor = toSingle(sp["cursor"]);
  const path = `/admin/identity-conflicts${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`;
  const result = await safeServerFetch<ListIdentityConflictsResponse>(path);

  return (
    <section className="flex flex-col gap-4" data-route="admin" data-section-rhythm="compact">
      <AdminPageHeader
        eyebrow="ADMIN / IDENTITY"
        title="Identity 重複候補"
        description="name + 所属が完全一致する identity 候補。merge は二段階確認"
        breadcrumbs={[{ label: "管理", href: "/admin" }, { label: "Identity 重複候補" }]}
      />

      {!result.ok ? (
        <AdminSectionErrorClient
          sectionLabel="Identity 重複候補"
          code={result.error.code}
          message={result.error.message}
        />
      ) : result.data.items.length === 0 ? (
        <AdminEmptyState title="現在、merge 候補はありません。" icon="shield" />
      ) : (
        <AdminSectionCard
          title="候補一覧"
          description="候補ごとに merge または別人マークを判断します。"
        >
          <ul className="divide-y divide-[var(--ubm-color-border-default)] rounded-md border border-[var(--ubm-color-border-default)]">
            {result.data.items.map((item) => (
              <li key={item.conflictId} className="px-4 py-3">
                <IdentityConflictRow item={item} />
              </li>
            ))}
          </ul>
          {result.data.nextCursor && (
            <div className="mt-6 text-right">
              <Link
                href={`?cursor=${encodeURIComponent(result.data.nextCursor)}`}
                className="text-sm text-[var(--ubm-color-link-default)] underline-offset-2 hover:underline"
              >
                次のページ →
              </Link>
            </div>
          )}
        </AdminSectionCard>
      )}
    </section>
  );
}
