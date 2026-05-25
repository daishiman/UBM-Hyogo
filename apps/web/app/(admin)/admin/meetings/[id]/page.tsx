// /admin/meetings/[id]: session 詳細 + 出席登録 (E2E attendance.spec.ts)
// 不変条件 #15: 第1防御=重複登録 toast / 第2防御=削除済み member は候補に含めない
import { safeServerFetch } from "../../../../../src/lib/admin/safe-server-fetch";
import { AdminSectionErrorClient } from "../../../../../src/features/admin/components/_shared";
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
  if (!result.ok) {
    return (
      <AdminSectionErrorClient
        sectionLabel="開催詳細"
        code={result.error.code}
        message={result.error.message}
      />
    );
  }
  return (
    <>
      <MeetingAttendancePanel detail={result.data} />
      <AttendanceCsvImportPanel sessionId={id} />
    </>
  );
}
