// TODO(08b): 実装は Phase 11 manual smoke で活性化
import { test } from '../fixtures/auth'
import { AdminMeetingsPage } from '../page-objects/AdminMeetingsPage'

test.describe.skip('attendance 二重防御 (#15)', () => {
  // 不変条件 #15: 第 1 防御 — 重複登録 toast
  test('重複登録 → toast 表示', async ({ adminPage }) => {
    const meetings = new AdminMeetingsPage(adminPage)
    await meetings.visit('sess-1')
    await meetings.registerAttendance('m-1')
    await meetings.registerAttendance('m-1')
    await meetings.expectDupToast()
    await meetings.screenshot('attendance-dup-toast', 'desktop')
  })

  // 不変条件 #15 / #7: 第 2 防御 — 削除済み member は候補から除外
  test('削除済み member は候補に出ない', async ({ adminPage }) => {
    const meetings = new AdminMeetingsPage(adminPage)
    await meetings.visit('sess-1')
    await meetings.expectDeletedMemberExcluded('m-5')
    await meetings.screenshot('attendance-deleted-excluded', 'desktop')
  })
})
