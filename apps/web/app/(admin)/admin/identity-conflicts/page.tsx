// serial-05: /(admin)/admin/identity-conflicts — blueprint 09g:741-840
// issue-194-03b-followup-001-email-conflict-identity-merge
// admin identity-conflicts list page
//   - admin gate は (admin)/layout.tsx で済 / API 呼び出しは fetchAdmin proxy
//   - 不変条件 #3: responseEmail は API 側で既に部分マスク済 (raw email を表示しない)
//   - 不変条件 #5: D1 直接アクセスなし
import { safeServerFetch } from "../../../../src/lib/admin/safe-server-fetch";
import { EmptyState } from "../../../../src/components/ui/EmptyState";
import { Pagination } from "../../../../src/components/ui/Pagination";
import { AdminPageHeader } from "../../../../src/features/admin/components";
import {
  AdminSectionCard,
  AdminSectionErrorClient,
} from "../../../../src/features/admin/components/_shared";
import type { ListIdentityConflictsResponse } from "@ubm-hyogo/shared";
import { IdentityConflictAnnouncer } from "../../../../src/components/admin/IdentityConflictAnnouncer";
import { IdentityConflictGuide } from "../../../../src/components/admin/IdentityConflictGuide";
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
  const page = cursor ? 2 : 1;

  return (
    <section className="flex flex-col gap-4" data-route="admin" data-section-rhythm="compact">
      <AdminPageHeader
        eyebrow="会員管理"
        title="会員の重複確認"
        description={
          result.ok
            ? `氏名と職業が一致する「重複の可能性がある会員」が ${result.data.items.length} 組`
            : "重複候補の読み込みに失敗しました"
        }
        breadcrumbs={[{ label: "管理", href: "/admin" }, { label: "会員の重複確認" }]}
      />
      <IdentityConflictGuide />

      {!result.ok ? (
        <AdminSectionErrorClient
          sectionLabel="会員の重複確認"
          code={result.error.code}
          message={result.error.message}
        />
      ) : result.data.items.length === 0 ? (
        <EmptyState
          className="admin-empty-state"
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z" />
            </svg>
          }
          title="現在、重複の可能性がある会員は見つかっていません。"
        />
      ) : (
        <AdminSectionCard
          title="重複の可能性がある会員"
          description="「統合」は2段階の確認、「別人として確定」は理由を入力してから実行します。"
          density="compact"
        >
          <IdentityConflictAnnouncer>
            <ul className="flex flex-col gap-3" aria-label="重複の可能性がある会員の一覧">
              {result.data.items.map((item) => (
                <li key={item.conflictId}>
                  <IdentityConflictRow item={item} />
                </li>
              ))}
            </ul>
          </IdentityConflictAnnouncer>
          {result.data.nextCursor && (
            <Pagination
              current={page}
              hasPrev={Boolean(cursor)}
              hasNext
              prevHref={cursor ? "/admin/identity-conflicts" : undefined}
              nextHref={`?cursor=${encodeURIComponent(result.data.nextCursor)}`}
              className="mt-4 [&_a]:text-[var(--ubm-color-link-default)]"
            />
          )}
        </AdminSectionCard>
      )}
    </section>
  );
}
