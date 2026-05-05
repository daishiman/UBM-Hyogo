// meeting / attendance ドメイン専用 branded type
// MemberId / ResponseId とは独立 module で管理し、cross-domain coupling を避ける（02a 確定済み契約を保護）

declare const __meetingBrand: unique symbol;
type MeetingBrand<T, B extends string> = T & { readonly [__meetingBrand]: B };

export type MeetingSessionId = MeetingBrand<string, "MeetingSessionId">;
export type AttendanceRecordId = MeetingBrand<string, "AttendanceRecordId">;

export const toMeetingSessionId = (raw: string): MeetingSessionId =>
  raw as MeetingSessionId;
export const toAttendanceRecordId = (raw: string): AttendanceRecordId =>
  raw as AttendanceRecordId;
