// serial-05: /(admin)/admin/identity-conflicts — blueprint 09g:741-840
// issue-194-03b-followup-001-email-conflict-identity-merge
// admin identity-conflicts list page
//   - admin gate は (admin)/layout.tsx で済 / API 呼び出しは fetchAdmin proxy
//   - 不変条件 #3: responseEmail は API 側で既に部分マスク済 (raw email を表示しない)
//   - 不変条件 #5: D1 直接アクセスなし
import { safeServerFetch } from "../../../../src/lib/admin/safe-server-fetch";
import { Breadcrumb } from "@/components/admin/Breadcrumb";
import { EmptyState } from "../../../../src/components/ui/EmptyState";
import { AdminSectionErrorClient } from "../../../../src/features/admin/components/_shared";
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
    <main className="mx-auto max-w-5xl px-6 py-8" data-route="admin" data-section-rhythm="compact">
      <Breadcrumb items={[{ label: "管理", href: "/admin" }, { label: "Identity 重複候補" }]} />
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Identity 重複候補</h1>
        <p className="mt-2 text-sm text-zinc-600">
          name + 所属が完全一致する identity 候補を表示します。merge は二段階確認が必要です。
          別人の場合は「別人マーク」で再検出を抑止できます。
        </p>
      </header>

      {!result.ok ? (
        <AdminSectionErrorClient
          sectionLabel="Identity 重複候補"
          code={result.error.code}
          message={result.error.message}
        />
      ) : result.data.items.length === 0 ? (
        <EmptyState title="現在、merge 候補はありません。" />
      ) : (
        <>
          <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200">
            {result.data.items.map((item) => (
              <li key={item.conflictId} className="px-4 py-3">
                <IdentityConflictRow item={item} />
              </li>
            ))}
          </ul>
          {result.data.nextCursor && (
            <div className="mt-6 text-right">
              <a
                href={`?cursor=${encodeURIComponent(result.data.nextCursor)}`}
                className="text-sm text-blue-600 underline-offset-2 hover:underline"
              >
                次のページ →
              </a>
            </div>
          )}
        </>
      )}
    </main>
  );
}
