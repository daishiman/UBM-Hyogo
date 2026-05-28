import type { AdminMemberListView } from "@ubm-hyogo/shared";
import { AdminPageHeader } from "../../../../src/features/admin/components/_layout/AdminPageHeader";
import { AdminSectionErrorClient } from "../../../../src/features/admin/components/_shared";
import {
  MeetingsClientShell,
  type MeetingsListView,
} from "../../../../src/features/admin/components/_meetings";
import { safeServerFetch } from "../../../../src/lib/admin/safe-server-fetch";

export const dynamic = "force-dynamic";

export default async function AdminMeetingsPage() {
  const [meetingsResult, membersResult] = await Promise.all([
    safeServerFetch<MeetingsListView>("/admin/meetings"),
    safeServerFetch<AdminMemberListView>("/admin/members"),
  ]);
  const ok = meetingsResult.ok && membersResult.ok;
  return (
    <section className="flex flex-col gap-4">
      <AdminPageHeader
        title="開催日 / 出席管理"
        description={
          ok && meetingsResult.ok
            ? `${meetingsResult.data.total} 件の開催`
            : "読み込みに失敗"
        }
        breadcrumbs={[
          { label: "管理", href: "/admin" },
          { label: "開催日 / 出席管理" },
        ]}
      />
      {ok && meetingsResult.ok && membersResult.ok ? (
        <MeetingsClientShell
          initial={meetingsResult.data}
          candidates={membersResult.data.members
            .filter((m) => !m.isDeleted)
            .map((m) => ({ memberId: m.memberId, fullName: m.fullName }))}
        />
      ) : (
        (() => {
          const err = !meetingsResult.ok
            ? meetingsResult.error
            : !membersResult.ok
              ? membersResult.error
              : null;
          return (
            <AdminSectionErrorClient
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
