# Branded Type Module

## Path

`apps/api/src/repository/_shared/branded-types/meeting.ts`

## Types

- `MeetingSessionId`
- `AttendanceRecordId`
- `toMeetingSessionId(raw: string)`
- `toAttendanceRecordId(raw: string)`

## Non-Interference Rule

Do not modify existing `MemberId` / `ResponseId` import paths. Meeting and attendance brands live in their own module to avoid cross-domain coupling.
