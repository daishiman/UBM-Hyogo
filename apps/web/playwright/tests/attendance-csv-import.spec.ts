import { expect, test } from '../fixtures/auth'
import { AdminMeetingsPage } from '../page-objects/AdminMeetingsPage'
import { mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const PHASE11_DIR = resolve(
  '../../docs/30-workflows/completed-tasks/ut-07c-followup-001-attendance-csv-import/outputs/phase-11',
)
const SCREENSHOT_DIR = join(PHASE11_DIR, 'screenshots')

const csvFile = (name: string, rows: string): { name: string; mimeType: string; buffer: Buffer } => ({
  name,
  mimeType: 'text/csv',
  buffer: Buffer.from(`memberId,email\n${rows}`, 'utf8'),
})

async function screenshot(page: import('@playwright/test').Page, file: string): Promise<void> {
  await mkdir(SCREENSHOT_DIR, { recursive: true })
  await page.screenshot({ path: join(SCREENSHOT_DIR, file), fullPage: true })
}

test.describe('UT-07C-FU-001 attendance CSV import screenshots', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('captures canonical Phase 11 screenshots', async ({ adminPage, mockApi }) => {
    await mockApi.seedMeetings()
    const meetings = new AdminMeetingsPage(adminPage)
    await meetings.visit('sess-1')

    const panel = adminPage.getByTestId('attendance-csv-import-panel')
    await expect(panel).toBeVisible()
    // React hydration を待つ: data-hydrated="true" になるまで onChange handler 未 bind の race を避ける。
    await expect(panel).toHaveAttribute('data-hydrated', 'true')
    await screenshot(adminPage, 'S1-upload.png')

    // Next.js dev server は /api/admin/* catch-all route の初回コンパイルに 10s 以上
     // かかることがあり、step-preview を待つ expect の既定 10s timeout を超過する事例が
     // CI (mobile-webkit / desktop-firefox / desktop-chromium) で頻発したため、初回 import
     // 関連の遷移待ちは 30s に延ばす。これは「初回コンパイル + dryRun POST round-trip」を
     // 安定的に吸収するための margin。
    await adminPage
      .getByTestId('csv-file-input')
      .setInputFiles(csvFile('preview.csv', 'm-2,\nm-1,\nm-404,'))
    await expect(adminPage.getByTestId('step-preview')).toBeVisible({ timeout: 30_000 })
    await expect(adminPage.getByTestId('confirm-import')).toBeDisabled()
    await screenshot(adminPage, 'S2-preview.png')

    await adminPage.getByTestId('cancel-import').click()
    await adminPage.getByTestId('csv-file-input').setInputFiles(csvFile('commit.csv', 'm-2,'))
    await expect(adminPage.getByTestId('confirm-import')).toBeEnabled({ timeout: 30_000 })
    await adminPage.getByTestId('confirm-import').click()
    await expect(adminPage.getByTestId('step-done')).toContainText('1 件を登録しました', {
      timeout: 30_000,
    })
    await screenshot(adminPage, 'S3-confirm-done.png')

    await adminPage.getByTestId('reset-import').click()
    await adminPage
      .getByTestId('csv-file-input')
      .setInputFiles(csvFile('deleted.csv', 'm-5,'))
    await expect(adminPage.getByTestId('step-preview')).toContainText('deleted_member 1', {
      timeout: 30_000,
    })
    await expect(adminPage.getByTestId('confirm-import')).toBeDisabled()
    await screenshot(adminPage, 'S4-error-deleted-member.png')
  })
})
