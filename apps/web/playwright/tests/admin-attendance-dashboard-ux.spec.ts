import { expect, test } from '../fixtures/auth'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Locator, Page } from '@playwright/test'

const TASK_ID = 'admin-attendance-dashboard-jp-clarity-and-ux'
const PHASE11_DIR = `../../docs/30-workflows/${TASK_ID}/outputs/phase-11`
const SCREENSHOT_DIR = join(PHASE11_DIR, 'screenshots')

const hideDevOverlay = async (page: Page) => {
  // WebKit は Report-Only CSP の style-src でも addStyleTag を reject するため try/catch で許容する。
  // 注入は dev overlay 抑制目的の cosmetic で機能アサーションには影響しない（login-smoke.spec.ts と同パターン）。
  try {
    await page.addStyleTag({
      content:
        'nextjs-portal, [data-nextjs-toast], [data-nextjs-dialog-overlay], [data-nextjs-dialog] { display: none !important; }',
    })
  } catch {
    // CSP reject 時は dev overlay 抑制なしで撮影を継続する
  }
}

const screenshotPage = async (page: Page, file: string) => {
  await mkdir(SCREENSHOT_DIR, { recursive: true })
  await hideDevOverlay(page)
  await page.screenshot({ path: join(SCREENSHOT_DIR, file), fullPage: true })
}

const screenshotElement = async (page: Page, locator: Locator, file: string) => {
  await mkdir(SCREENSHOT_DIR, { recursive: true })
  await hideDevOverlay(page)
  await locator.scrollIntoViewIfNeeded()
  await locator.screenshot({ path: join(SCREENSHOT_DIR, file) })
}

test.describe('admin-attendance-dashboard-jp-clarity-and-ux Phase 11 local screenshots', () => {
  test('captures canonical Japanese clarity screenshots', async ({
    adminPage,
    mockApi,
  }, testInfo) => {
    testInfo.setTimeout(180_000)
    await mockApi.setAttendanceDashboardScenario('all-ok')

    await adminPage.setViewportSize({ width: 1280, height: 800 })
    await adminPage.goto('/admin/dashboard/attendance', { waitUntil: 'domcontentloaded' })
    await expect(adminPage.getByRole('heading', { level: 1, name: '出席ダッシュボード' })).toBeVisible()
    await expect(adminPage.getByRole('heading', { level: 2, name: '全体の状況' })).toBeVisible()
    await expect(adminPage.getByRole('heading', { level: 2, name: '出席の移り変わり' })).toBeVisible()
    await expect(adminPage.getByRole('heading', { level: 2, name: 'くわしい一覧' })).toBeVisible()
    await expect(adminPage.getByRole('heading', { level: 3, name: '出席回数べつの人数' })).toBeVisible()
    await expect(adminPage.getByText('各メンバーがこれまでに参加した合計回数')).toBeVisible()
    await expect(adminPage.getByRole('radio', { name: '開催回ごと' })).toBeVisible()
    await expect(adminPage.getByRole('radio', { name: '出席が多い順' })).toBeVisible()
    await expect(adminPage.getByTestId('attendance-export-link')).toContainText('表計算ファイルで書き出す')
    await expect(adminPage.getByTestId('attendance-kpi-attendees')).not.toContainText('unique')
    await screenshotPage(adminPage, 'attendance-dashboard-full-jp.png')
    await screenshotElement(adminPage, adminPage.locator('.attendance-zone--primary'), 'attendance-overview-zone-jp.png')
    await screenshotElement(adminPage, adminPage.locator('.attendance-zone--trend'), 'attendance-trend-zone-jp.png')
    await screenshotElement(adminPage, adminPage.getByTestId('attendance-detail-tabs'), 'attendance-detail-tabs-jp.png')
    await screenshotElement(adminPage, adminPage.getByTestId('attendance-filter-bar'), 'attendance-filter-bar-jp.png')

    await adminPage.setViewportSize({ width: 390, height: 844 })
    await adminPage.goto('/admin/dashboard/attendance', { waitUntil: 'domcontentloaded' })
    await expect(adminPage.getByRole('heading', { level: 1, name: '出席ダッシュボード' })).toBeVisible()
    await expect(adminPage.getByTestId('attendance-zone-distribution')).toBeVisible()
    await screenshotPage(adminPage, 'attendance-dashboard-mobile-jp.png')

    await writeFile(
      join(PHASE11_DIR, 'screenshot-inventory.json'),
      JSON.stringify(
        {
          taskId: TASK_ID,
          mode: 'local-playwright-fixture',
          route: '/admin/dashboard/attendance',
          status: 'captured_local_fixture',
          screenshots: [
            {
              tc: 'TC-V-01',
              file: 'screenshots/attendance-dashboard-full-jp.png',
              viewport: '1280x800',
              status: 'present',
            },
            {
              tc: 'TC-V-02',
              file: 'screenshots/attendance-overview-zone-jp.png',
              viewport: '1280x800',
              status: 'present',
            },
            {
              tc: 'TC-V-03',
              file: 'screenshots/attendance-trend-zone-jp.png',
              viewport: '1280x800',
              status: 'present',
            },
            {
              tc: 'TC-V-04',
              file: 'screenshots/attendance-detail-tabs-jp.png',
              viewport: '1280x800',
              status: 'present',
            },
            {
              tc: 'TC-V-05',
              file: 'screenshots/attendance-filter-bar-jp.png',
              viewport: '1280x800',
              status: 'present',
            },
            {
              tc: 'TC-V-06',
              file: 'screenshots/attendance-dashboard-mobile-jp.png',
              viewport: '390x844',
              status: 'present',
            },
          ],
          runtimeBoundary: 'staging authenticated screenshots remain user-gated; local fixture screenshots are committed Phase 11 visual evidence',
        },
        null,
        2,
      ),
    )
  })
})
