import { expect, test } from '../fixtures/auth'
import { AdminMeetingsPage } from '../page-objects/AdminMeetingsPage'

test.describe('attendance visual smoke (#313)', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('detail: 削除済み member は候補に出ない', async ({ adminPage, mockApi }) => {
    await mockApi.seedMeetings()
    const meetings = new AdminMeetingsPage(adminPage)

    await meetings.visit('sess-1')

    await meetings.expectDeletedMemberExcluded('m-5')
    await meetings.screenshot('attendance-deleted-excluded', 'desktop')
  })

  test('detail: 登録済み member は登録済として可視化される', async ({ adminPage, mockApi }) => {
    await mockApi.seedMeetings()
    const meetings = new AdminMeetingsPage(adminPage)

    await meetings.visit('sess-1')

    await meetings.expectAlreadyRegistered('m-1')
    await meetings.screenshot('attendance-already-registered', 'desktop')
  })

  test('detail: 登録済み member クリックで duplicate toast 表示', async ({ adminPage, mockApi }) => {
    await mockApi.seedMeetings()
    const meetings = new AdminMeetingsPage(adminPage)

    await meetings.visit('sess-1')
    await meetings.registerAttendance('m-1')
    await meetings.screenshot('attendance-dup-1', 'desktop')

    await meetings.expectDupToast()
    await meetings.screenshot('attendance-dup-2', 'desktop')
  })

  test('list: delete 後 attendance state が更新される', async ({ adminPage, mockApi }) => {
    await mockApi.seedMeetings()
    const meetings = new AdminMeetingsPage(adminPage)

    await meetings.visit()

    await expect(meetings.listPageSelectOption('sess-1', 'm-1')).toHaveJSProperty(
      'disabled',
      true,
    )
    await meetings.expectAttendeePresent('sess-1', 'm-1', true)
    await meetings.screenshot('attendance-delete-before', 'desktop')
    await meetings.openRemoveAttendanceDialog('sess-1', 'm-1')
    await meetings.screenshot('attendance-confirm-remove', 'desktop')
    await meetings.confirmOpenDialog()

    await meetings.expectListToast('出席を削除しました')
    await meetings.expectAttendeePresent('sess-1', 'm-1', false)
    await expect(meetings.listPageSelectOption('sess-1', 'm-1')).toHaveJSProperty(
      'disabled',
      false,
    )
    await meetings.screenshot('attendance-delete-after', 'desktop')
  })

  test('list: 開催日 soft delete confirm dialog が表示される', async ({ adminPage, mockApi }) => {
    await mockApi.seedMeetings()
    const meetings = new AdminMeetingsPage(adminPage)

    await meetings.visit()
    await meetings.openDeleteMeetingDialog('sess-1')
    await meetings.screenshot('meeting-delete-confirm', 'desktop')
  })
})
