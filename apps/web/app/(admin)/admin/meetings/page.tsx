// 06c: /admin/meetings 開催日 + attendance
// 不変条件 #15: attendance 候補は !isDeleted のみ。重複 POST は disabled / 422 toast
import type { AdminMemberListView } from "@ubm-hyogo/shared";
import { fetchAdmin } from "../../../../src/lib/admin/server-fetch";
import { MeetingPanel } from "../../../../src/components/admin/MeetingPanel";
import type { MeetingsListView } from "../../../../src/components/admin/MeetingPanel";

export const dynamic = "force-dynamic";

export default async function AdminMeetingsPage() {
  const [meetings, members] = await Promise.all([
    fetchAdmin<MeetingsListView>("/admin/meetings"),
    fetchAdmin<AdminMemberListView>("/admin/members"),
  ]);
  // 削除済み除外（不変条件 #15: UI 側 filter による二重防御）
  const candidates = members.members
    .filter((m) => !m.isDeleted)
    .map((m) => ({ memberId: m.memberId, fullName: m.fullName }));
  return <MeetingPanel meetings={meetings} candidates={candidates} />;
}
