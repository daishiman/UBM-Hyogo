// 06c: /admin/meetings 開催日 + attendance
// 不変条件 #15: attendance 候補は !isDeleted のみ。重複 POST は disabled / 422 toast
import type { AdminMemberListView } from "@ubm-hyogo/shared";
import { Breadcrumb } from "@/components/admin/Breadcrumb";
import { safeServerFetch } from "../../../../src/lib/admin/safe-server-fetch";
import { AdminSectionError } from "../../../../src/features/admin/components/_shared";
import { MeetingPanel } from "../../../../src/components/admin/MeetingPanel";
import type { MeetingsListView } from "../../../../src/components/admin/MeetingPanel";

export const dynamic = "force-dynamic";

export default async function AdminMeetingsPage() {
  const [meetingsResult, membersResult] = await Promise.all([
    safeServerFetch<MeetingsListView>("/admin/meetings"),
    safeServerFetch<AdminMemberListView>("/admin/members"),
  ]);
  return (
    <section className="flex flex-col gap-4">
      <Breadcrumb items={[{ label: "管理", href: "/admin" }, { label: "開催日 / 出席管理" }]} />
      {meetingsResult.ok && membersResult.ok ? (
        <MeetingPanel
          meetings={meetingsResult.data}
          candidates={membersResult.data.members
            .filter((m) => !m.isDeleted)
            .map((m) => ({ memberId: m.memberId, fullName: m.fullName }))}
        />
      ) : (
        (() => {
          const err = !meetingsResult.ok ? meetingsResult.error : !membersResult.ok ? membersResult.error : null;
          return (
            <AdminSectionError
              sectionLabel="開催日 / 出席管理"
              {...(err?.code ? { code: err.code } : {})}
              {...(err?.message ? { message: err.message } : {})}
            />
          );
        })()
      )}
    </section>
  );
}
