import { AdminPageHeader } from "../../../../../src/features/admin/components/_layout/AdminPageHeader";
import { AdminSectionErrorClient } from "../../../../../src/features/admin/components/_shared";
import { safeServerFetch } from "../../../../../src/lib/admin/safe-server-fetch";
import { MeetingAttendancePanel } from "./MeetingAttendancePanel";
import { AttendanceCsvImportPanel } from "./AttendanceCsvImportPanel";

export const dynamic = "force-dynamic";

interface Candidate {
  memberId: string;
  fullName: string;
  isDeleted?: boolean;
}
interface MeetingDetail {
  sessionId: string;
  title: string;
  heldOn: string;
  candidates: Candidate[];
  attendees: Array<{ memberId: string }>;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminMeetingDetailPage({ params }: Props) {
  const { id } = await params;
  const result = await safeServerFetch<MeetingDetail>(
    `/admin/meetings/${encodeURIComponent(id)}`,
  );
  const titleLabel = result.ok
    ? `${result.data.heldOn} ${result.data.title}`
    : "開催詳細";
  return (
    <section className="flex flex-col gap-4">
      <AdminPageHeader
        title={titleLabel}
        description={
          result.ok
            ? `候補 ${result.data.candidates.length} 名 / 出席 ${result.data.attendees.length} 名`
            : "読み込みに失敗"
        }
        breadcrumbs={[
          { label: "管理", href: "/admin" },
          { label: "開催日 / 出席管理", href: "/admin/meetings" },
          { label: titleLabel },
        ]}
      />
      {result.ok ? (
        <>
          <MeetingAttendancePanel detail={result.data} />
          <AttendanceCsvImportPanel sessionId={id} />
        </>
      ) : (
        <AdminSectionErrorClient
          sectionLabel="開催詳細"
          code={result.error.code}
          message={result.error.message}
        />
      )}
    </section>
  );
}
