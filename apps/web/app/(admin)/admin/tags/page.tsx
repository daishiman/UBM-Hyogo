// serial-05: /(admin)/admin/tags — blueprint 09g:281-400
// 06c: /admin/tags キュー画面
// AC-2 の受け先: ?memberId=... を保持する
import { safeServerFetch } from "../../../../src/lib/admin/safe-server-fetch";
import { Chip } from "@/components/ui/Chip";
import { AdminSectionErrorClient } from "../../../../src/features/admin/components/_shared";
import { AdminPageHeader } from "../../../../src/features/admin/components/_layout/AdminPageHeader";
import { TagQueuePanel } from "../../../../src/components/admin/TagQueuePanel";
import type { TagQueueStatus } from "../../../../src/components/admin/TagQueuePanel";
import { TagManagementGuide } from "../../../../src/components/admin/TagManagementGuide";
import { TAG_MANAGEMENT_COPY } from "../../../../src/lib/admin/tagManagementGlossary";

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
    <section className="flex flex-col gap-4">
      <AdminPageHeader
        eyebrow="ADMIN / TAGS"
        title="タグ割当"
        description={TAG_MANAGEMENT_COPY.assignmentHeaderDescription}
        breadcrumbs={[{ label: "管理", href: "/admin" }, { label: "タグ割当" }]}
      />
      <TagManagementGuide variant="assignment" />
      {counts ? (
        <div className="chip-row" aria-label="タグ割当件数">
          <Chip tone="amber">未解決 {counts.queued + counts.reviewing}件</Chip>
          <Chip tone="green">解決済 {counts.resolved}件</Chip>
          {counts.dlq > 0 ? <Chip tone="red">DLQ {counts.dlq}件</Chip> : null}
        </div>
      ) : null}
      {result.ok ? (
        <TagQueuePanel
          initial={result.data}
          filter={status}
          focusMemberId={focusMemberId ?? null}
        />
      ) : (
        <AdminSectionErrorClient
          sectionLabel="タグ割当"
          code={result.error.code}
          message={result.error.message}
        />
      )}
    </section>
  );
}
