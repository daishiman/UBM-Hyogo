export type MockMember = {
  memberId: string
  fullName: string
  isDeleted?: boolean
}

export type MockMeeting = {
  sessionId: string
  title: string
  heldOn: string
  note: string | null
  createdAt: string
  candidates: MockMember[]
  attendees: Array<{ memberId: string; assignedAt?: string; assignedBy?: string }>
}

export type MockMeetingsSeed = {
  members: MockMember[]
  meetings: MockMeeting[]
}

export const defaultAttendanceSeed = (): MockMeetingsSeed => ({
  members: [
    { memberId: 'm-1', fullName: '青木 太郎' },
    { memberId: 'm-2', fullName: '兵庫 花子' },
    { memberId: 'm-3', fullName: '神戸 次郎' },
    { memberId: 'm-5', fullName: '削除済み 会員', isDeleted: true },
  ],
  meetings: [
    {
      sessionId: 'sess-1',
      title: '2026年5月 定例会',
      heldOn: '2026-05-15',
      note: 'attendance visual smoke fixture',
      createdAt: '2026-05-15T00:00:00.000Z',
      candidates: [
        { memberId: 'm-1', fullName: '青木 太郎' },
        { memberId: 'm-2', fullName: '兵庫 花子' },
        { memberId: 'm-3', fullName: '神戸 次郎' },
        { memberId: 'm-5', fullName: '削除済み 会員', isDeleted: true },
      ],
      attendees: [{ memberId: 'm-1', assignedAt: '2026-05-15T00:00:00.000Z' }],
    },
  ],
})

export const unregisteredAttendanceSeed = (): MockMeetingsSeed => {
  const seed = defaultAttendanceSeed()
  return {
    ...seed,
    meetings: seed.meetings.map((meeting) => ({ ...meeting, attendees: [] })),
  }
}
