// serial-05: /(admin)/admin/tags — blueprint 09g:281-400
// 06c: /admin/tags キュー画面
// AC-2 の受け先: ?memberId=... を保持する
import { safeServerFetch } from "../../../../src/lib/admin/safe-server-fetch";
import { Breadcrumb } from "@/components/admin/Breadcrumb";
import { Chip } from "@/components/ui/Chip";
import { AdminSectionErrorClient } from "../../../../src/features/admin/components/_shared";
import { TagQueuePanel } from "../../../../src/components/admin/TagQueuePanel";
import type { TagQueueStatus } from "../../../../src/components/admin/TagQueuePanel";

interface QueueItem {
  queueId: string;
  memberId: string;
  responseId: string;
  status: TagQueueStatus;
  suggestedTagsJson: string;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
}
interface QueueListView {
  total: number;
  items: QueueItem[];
}

export const dynamic = "force-dynamic";

export default async function AdminTagsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const status = (() => {
    const s = sp["status"];
    return s === "queued" || s === "reviewing" || s === "resolved" || s === "rejected" || s === "dlq"
      ? s
      : undefined;
  })();
  const focusMemberId = sp["memberId"];
  const qs = status ? `?status=${status}` : "";
  const result = await safeServerFetch<QueueListView>(`/admin/tags/queue${qs}`);
  const counts = result.ok
    ? result.data.items.reduce(
        (acc, item) => {
          acc[item.status] += 1;
          return acc;
        },
        {
          queued: 0,
          reviewing: 0,
          resolved: 0,
          rejected: 0,
          dlq: 0,
        } satisfies Record<TagQueueStatus, number>,
      )
    : null;

  return (
    <section className="admin-tags-page">
      <Breadcrumb items={[{ label: "タグキュー" }]} />
      <header className="page-head">
        <div className="eyebrow">ADMIN / TAGS</div>
        <h1 className="h-page">タグキュー</h1>
        <p className="muted">
          未解決のタグ提案をレビューし、メンバーに割り当てます。
        </p>
        {counts ? (
          <div className="chip-row" aria-label="タグキュー件数">
            <Chip tone="amber">未解決 {counts.queued + counts.reviewing}件</Chip>
            <Chip tone="green">解決済 {counts.resolved}件</Chip>
            {counts.dlq > 0 ? <Chip tone="red">DLQ {counts.dlq}件</Chip> : null}
          </div>
        ) : null}
      </header>
      {result.ok ? (
        <TagQueuePanel
          initial={result.data}
          filter={status}
          focusMemberId={focusMemberId ?? null}
        />
      ) : (
        <AdminSectionErrorClient
          sectionLabel="タグキュー"
          code={result.error.code}
          message={result.error.message}
        />
      )}
    </section>
  );
}
