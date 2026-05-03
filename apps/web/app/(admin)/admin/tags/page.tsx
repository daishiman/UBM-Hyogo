// 06c: /admin/tags キュー画面
// AC-2 の受け先: ?memberId=... を保持する
import { fetchAdmin } from "../../../../src/lib/admin/server-fetch";
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
  const data = await fetchAdmin<QueueListView>(`/admin/tags/queue${qs}`);
  return (
    <TagQueuePanel
      initial={data}
      filter={status}
      focusMemberId={focusMemberId ?? null}
    />
  );
}
