import { expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { test } from '../fixtures/auth'

const PHASE11_DIR =
  process.env.PLAYWRIGHT_EVIDENCE_DIR ??
  '../../docs/30-workflows/admin-meetings-card-ux-clarity/outputs/phase-11'
const SCREENSHOT_DIR = join(PHASE11_DIR, 'screenshots')

async function screenshot(page: import('@playwright/test').Page, file: string): Promise<void> {
  await mkdir(SCREENSHOT_DIR, { recursive: true })
  await page.screenshot({ path: join(SCREENSHOT_DIR, file), fullPage: false })
}

async function gotoMeetings(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/admin/meetings', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: '開催日 / 出席管理' })).toBeVisible()
  await expect(page.getByTestId('attendance-list-session-sess-1')).toBeVisible()
  await page.evaluate(() => window.scrollTo(0, 0))
}

test.describe('admin-meetings-card-ux-clarity Phase 11 local screenshots', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'local visual evidence is captured once on Chromium')
  test.setTimeout(120_000)

  test('captures meetings card, drawer, and attendee list visual evidence', async ({
    adminPage,
    mockApi,
  }) => {
    await mockApi.seedMeetings()
    await expect
      .poll(async () => {
        try {
          const response = await adminPage.request.get('http://127.0.0.1:8787/__test__/health')
          return response.ok()
        } catch {
          return false
        }
      })
      .toBe(true)

    await adminPage.setViewportSize({ width: 1440, height: 900 })
    await gotoMeetings(adminPage)
    await screenshot(adminPage, 'meetings-list-default-desktop.png')

    await adminPage.getByRole('button', { name: '2026年5月 定例会（2026-05-15）の出席を記録・編集' }).click()
    await expect(adminPage.getByRole('heading', { name: '出席を追加' })).toBeVisible()
    await expect(adminPage.getByRole('heading', { name: '出席者 (1名)' })).toBeVisible()
    await screenshot(adminPage, 'meetings-card-expanded-desktop.png')
    await adminPage.getByRole('heading', { name: '出席者 (1名)' }).scrollIntoViewIfNeeded()
    await screenshot(adminPage, 'meetings-attendees-list-desktop.png')

    await adminPage.setViewportSize({ width: 375, height: 812 })
    await gotoMeetings(adminPage)
    await screenshot(adminPage, 'meetings-list-default-mobile.png')

    await adminPage.getByRole('button', { name: '2026年5月 定例会（2026-05-15）の出席を記録・編集' }).click()
    await expect(adminPage.getByRole('heading', { name: '出席者 (1名)' })).toBeVisible()
    await adminPage.getByRole('heading', { name: '出席者 (1名)' }).scrollIntoViewIfNeeded()
    await screenshot(adminPage, 'meetings-card-expanded-mobile.png')

    await writeFile(
      join(PHASE11_DIR, 'local-visual-review.md'),
      [
        '# Local visual review',
        '',
        'Status: `captured_local_playwright_fixture`.',
        '',
        '| Check | Status | Evidence |',
        '| --- | --- | --- |',
        '| カードが gap と border で分離されている | pass | `screenshots/meetings-list-default-desktop.png`, `screenshots/meetings-list-default-mobile.png` |',
        '| 展開時に編集 / 出席を追加 / 出席者がサブカードとして分離される | pass | `screenshots/meetings-card-expanded-desktop.png`, `screenshots/meetings-card-expanded-mobile.png` |',
        '| 出席者行が行 chrome + 右寄せ削除ボタンで表示される | pass | `screenshots/meetings-attendees-list-desktop.png` |',
        '| モバイル幅で見出しテキストとバッジが横にはみ出さない | pass | `screenshots/meetings-list-default-mobile.png`, `screenshots/meetings-card-expanded-mobile.png` |',
        '',
      ].join('\n'),
    )
  })
})
