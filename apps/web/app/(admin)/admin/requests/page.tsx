// serial-05: /(admin)/admin/requests — blueprint 09g:641-740
// 04b-followup-004: /admin/requests admin queue resolve workflow page
// admin-requests-prototype-alignment-and-404-fix: page-head + h1 を page.tsx 側に集約
// 不変条件 #5: server fetch は admin proxy 経由のみ。
import { safeServerFetch } from "../../../../src/lib/admin/safe-server-fetch";
import { Breadcrumb } from "@/components/admin/Breadcrumb";
import { AdminSectionErrorClient } from "../../../../src/features/admin/components/_shared";
import {
  RequestQueuePanel,
  type RequestQueueListView,
  type RequestNoteType,
} from "../../../../src/components/admin/RequestQueuePanel";

export const dynamic = "force-dynamic";

const isNoteType = (v: unknown): v is RequestNoteType =>
  v === "visibility_request" || v === "delete_request";

interface AdminRequestsApiResponse {
  ok: boolean;
  items: RequestQueueListView["items"];
  nextCursor: string | null;
  appliedFilters: { status: string; type: string };
}

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const type: RequestNoteType = isNoteType(sp["type"]) ? sp["type"] : "visibility_request";
  const cursor = typeof sp["cursor"] === "string" ? sp["cursor"] : null;
  const query = new URLSearchParams({ status: "pending", type });
  if (cursor) query.set("cursor", cursor);
  const result = await safeServerFetch<AdminRequestsApiResponse>(
    `/admin/requests?${query.toString()}`,
  );
  return (
    <div className="page-enter stack-lg">
      <Breadcrumb items={[{ label: "依頼キュー" }]} />
      <header className="page-head">
        <p className="eyebrow">ADMIN / REQUESTS</p>
        <h1 id="admin-requests-h" className="h-page">
          依頼キュー
        </h1>
        <p className="lede">公開状態の変更依頼・退会依頼を確認・承認します。</p>
      </header>
      {result.ok ? (
        <RequestQueuePanel
          initial={{
            items: result.data.items ?? [],
            nextCursor: result.data.nextCursor ?? null,
            appliedFilters: result.data.appliedFilters ?? { status: "pending", type },
          }}
          type={type}
        />
      ) : (
        <AdminSectionErrorClient
          sectionLabel="依頼キュー"
          code={result.error.code}
          message={result.error.message}
        />
      )}
    </div>
  );
}
