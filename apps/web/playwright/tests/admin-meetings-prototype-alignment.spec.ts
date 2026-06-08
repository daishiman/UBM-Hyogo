import { expect, test } from '../fixtures/auth'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const WORKFLOW_ROOT = resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  '../../../../docs/30-workflows/admin-meetings-prototype-alignment',
)
const SCREENSHOT_DIR = join(WORKFLOW_ROOT, 'outputs/phase-11/screenshots')

async function capture(page: import('@playwright/test').Page, name: string): Promise<void> {
  await mkdir(SCREENSHOT_DIR, { recursive: true })
  await page.screenshot({ path: join(SCREENSHOT_DIR, name), fullPage: true })
}

test.describe('admin meetings prototype alignment evidence', () => {
  test.use({ viewport: { width: 1280, height: 800 } })
  test.setTimeout(180_000)

  test('captures list default, drawer, and empty states', async ({ adminPage, mockApi }) => {
    await mockApi.seedMeetings()
    await adminPage.goto('/admin/meetings', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(adminPage.getByRole('heading', { name: '開催日 / 出席管理' })).toBeVisible()
    await capture(adminPage, 'list-default.png')

    // MeetingsClientShell は "use client"。hydration 前の click は onClick 未装着で
    // 取りこぼされる（firefox は hydration が遅く drawer が開かないことがある）。
    // hydration 前の click は何もトグルしないため、click → drawer 表示を toPass で
    // リトライしても二重トグルは起きない（最初の hydration 後 click のみが開く）。
    const drawerToggle = adminPage.getByTestId('meeting-row-sess-1').getByRole('button')
    const drawerRegion = adminPage.getByRole('region', { name: '出席編集' })
    await expect(async () => {
      await drawerToggle.click()
      await expect(drawerRegion).toBeVisible({ timeout: 2000 })
    }).toPass({ timeout: 30_000 })
    await capture(adminPage, 'list-drawer-open.png')

    await mockApi.seedMeetings({ members: [], meetings: [] })
    await adminPage.reload()
    await expect(adminPage.getByTestId('admin-empty-state')).toBeVisible()
    await capture(adminPage, 'list-empty.png')
  })

  test('captures detail default and CSV preview states', async ({ adminPage, mockApi }) => {
    await mockApi.seedMeetings()
    await adminPage.goto('/admin/meetings/sess-1', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(adminPage.getByRole('heading', { name: /2026-05-15/ })).toBeVisible()
    await capture(adminPage, 'detail-default.png')

    const csvPath = join(tmpdir(), `admin-meetings-${Date.now()}.csv`)
    await writeFile(csvPath, 'memberId,email\nm-2,\n', 'utf8')
    await adminPage.route('**/api/admin/meetings/*/attendance/import?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          dryRun: true,
          committed: false,
          summary: {
            total: 1,
            ok: 1,
            duplicate: 0,
            deletedMember: 0,
            unknownMember: 0,
            invalid: 0,
          },
          rows: [{ index: 1, status: 'ok', memberId: 'm-2' }],
        }),
      })
    })
    await expect(adminPage.getByTestId('attendance-csv-import-panel')).toHaveAttribute(
      'data-hydrated',
      'true',
    )
    await adminPage.getByTestId('csv-file-input').setInputFiles(csvPath)
    await expect(adminPage.getByTestId('step-preview')).toBeVisible()
    await capture(adminPage, 'detail-csv-preview.png')
  })
})
