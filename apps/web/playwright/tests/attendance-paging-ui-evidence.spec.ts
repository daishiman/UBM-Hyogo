import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { expect, memberLogin, test } from '../fixtures/auth'

test.skip(
  process.env.PLAYWRIGHT_ATTENDANCE_PAGING_EVIDENCE !== '1',
  'Set PLAYWRIGHT_ATTENDANCE_PAGING_EVIDENCE=1 for Phase 11 attendance paging screenshot evidence',
)

test('captures attendance paging UI evidence', async ({ page, context, mockApi }) => {
  const initialRecords = Array.from({ length: 50 }, (_, index) => ({
    sessionId: `session-${index + 1}`,
    title: `定例会 ${index + 1}`,
    heldOn: `2026-04-${String((index % 28) + 1).padStart(2, '0')}`,
  }))
  await mockApi.setAttendancePage({
    initialRecords,
    nextRecords: [
      {
        sessionId: 'session-51',
        title: '定例会 51',
        heldOn: '2026-05-01',
      },
    ],
    cursor: 'cursor?x=1&y=2',
  })
  await page.route('**/api/me/attendance?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        records: [
          {
            sessionId: 'session-51',
            title: '定例会 51',
            heldOn: '2026-05-01',
          },
        ],
        hasMore: false,
        nextCursor: null,
      }),
    })
  })
  await memberLogin(context)

  await page.goto('/profile')
  await expect(page.getByRole('button', { name: 'もっと見る' })).toBeVisible()
  await page.getByRole('button', { name: 'もっと見る' }).click()
  await expect(page.getByText('定例会 51')).toBeVisible()
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
  })

  const screenshotDir =
    process.env.ATTENDANCE_PAGING_SCREENSHOT_DIR ??
    path.resolve(process.cwd(), '../../docs/30-workflows/parallel-04-attendance-paging-ui/outputs/phase-11/screenshots')
  await mkdir(screenshotDir, { recursive: true })
  await page.screenshot({
    path: path.join(screenshotDir, 'profile-attendance-paging-desktop.png'),
    fullPage: true,
  })
})
