// /admin/meetings/[id]: session 詳細 + 出席登録 (E2E attendance.spec.ts)
// 不変条件 #15: 第1防御=重複登録 toast / 第2防御=削除済み member は候補に含めない
import { fetchAdmin } from "../../../../../src/lib/admin/server-fetch";
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
  const detail = await fetchAdmin<MeetingDetail>(`/admin/meetings/${encodeURIComponent(id)}`);
  return (
    <>
      <MeetingAttendancePanel detail={detail} />
      <AttendanceCsvImportPanel sessionId={id} />
    </>
  );
}
