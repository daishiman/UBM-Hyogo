// serial-05: /(admin)/admin/tags — blueprint 09g:281-400
// 06c: /admin/tags キュー画面
// AC-2 の受け先: ?memberId=... を保持する
import { safeServerFetch } from "../../../../src/lib/admin/safe-server-fetch";
import { Breadcrumb } from "@/components/admin/Breadcrumb";
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
  return (
    <section className="flex flex-col gap-4">
      <Breadcrumb items={[{ label: "タグキュー" }]} />
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
