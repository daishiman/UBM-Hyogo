// issue-194-03b-followup-001-email-conflict-identity-merge
// admin identity-conflicts list page
//   - admin gate は (admin)/layout.tsx で済 / API 呼び出しは fetchAdmin proxy
//   - 不変条件 #3: responseEmail は API 側で既に部分マスク済 (raw email を表示しない)
//   - 不変条件 #5: D1 直接アクセスなし
import { fetchAdmin } from "../../../../src/lib/admin/server-fetch";
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
  const data = await fetchAdmin<ListIdentityConflictsResponse>(path);

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Identity 重複候補</h1>
        <p className="mt-2 text-sm text-zinc-600">
          name + 所属が完全一致する identity 候補を表示します。merge は二段階確認が必要です。
          別人の場合は「別人マーク」で再検出を抑止できます。
        </p>
      </header>

      {data.items.length === 0 ? (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
          現在、merge 候補はありません。
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200">
          {data.items.map((item) => (
            <li key={item.conflictId} className="px-4 py-3">
              <IdentityConflictRow item={item} />
            </li>
          ))}
        </ul>
      )}

      {data.nextCursor && (
        <div className="mt-6 text-right">
          <a
            href={`?cursor=${encodeURIComponent(data.nextCursor)}`}
            className="text-sm text-blue-600 underline-offset-2 hover:underline"
          >
            次のページ →
          </a>
        </div>
      )}
    </main>
  );
}
