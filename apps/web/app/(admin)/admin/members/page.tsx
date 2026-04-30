// 06c: /admin/members 一覧 (Server) + ドロワーは Client
// AC-1: profile 本文 input/textarea を出さない
// AC-2: tag 編集は /admin/tags?memberId への Link のみ
// AC-9: 管理メモはドロワー内のみ
import type { AdminMemberListView } from "@ubm-hyogo/shared";
import { fetchAdmin } from "../../../../src/lib/admin/server-fetch";
import { MembersClient } from "../../../../src/components/admin/MembersClient";

type Filter = "published" | "hidden" | "deleted";
const isFilter = (v: string | undefined): v is Filter =>
  v === "published" || v === "hidden" || v === "deleted";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filter = isFilter(sp["filter"]) ? sp["filter"] : undefined;
  const qs = filter ? `?filter=${filter}` : "";
  const initial = await fetchAdmin<AdminMemberListView>(`/admin/members${qs}`);
  return <MembersClient initial={initial} filter={filter} />;
}
