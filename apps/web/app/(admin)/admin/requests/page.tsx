// 04b-followup-004: /admin/requests admin queue resolve workflow page
// 不変条件 #5: server fetch は admin proxy 経由のみ。
import { fetchAdmin } from "../../../../src/lib/admin/server-fetch";
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
  const type: RequestNoteType = isNoteType(sp["type"])
    ? sp["type"]
    : "visibility_request";
  const cursor = typeof sp["cursor"] === "string" ? sp["cursor"] : null;
  const query = new URLSearchParams({ status: "pending", type });
  if (cursor) query.set("cursor", cursor);
  const data = await fetchAdmin<AdminRequestsApiResponse>(
    `/admin/requests?${query.toString()}`,
  );
  const view: RequestQueueListView = {
    items: data.items ?? [],
    nextCursor: data.nextCursor ?? null,
    appliedFilters: data.appliedFilters ?? { status: "pending", type },
  };
  return <RequestQueuePanel initial={view} type={type} />;
}
