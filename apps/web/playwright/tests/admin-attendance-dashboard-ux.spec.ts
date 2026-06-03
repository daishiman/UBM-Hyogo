import { expect, test } from '../fixtures/auth'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const PHASE11_DIR = '../../docs/30-workflows/admin-attendance-dashboard-ux/outputs/phase-11'
const SCREENSHOT_DIR = join(PHASE11_DIR, 'screenshots')

const screenshot = async (page: import('@playwright/test').Page, file: string) => {
  await mkdir(SCREENSHOT_DIR, { recursive: true })
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
  await page.screenshot({ path: join(SCREENSHOT_DIR, file), fullPage: true })
}

test.describe('admin-attendance-dashboard-ux Phase 11 local screenshots', () => {
  test('captures desktop and mobile attendance dashboard recovery states', async ({
    adminPage,
    mockApi,
  }) => {
    await mockApi.setAttendanceDashboardScenario('all-ok')

    await adminPage.setViewportSize({ width: 1280, height: 800 })
    await adminPage.goto('/admin/dashboard/attendance', { waitUntil: 'domcontentloaded' })
    await expect(adminPage.getByRole('heading', { level: 1, name: '出席ダッシュボード' })).toBeVisible()
    await expect(adminPage.getByText('出席回数帯別分布')).toBeVisible()
    await expect(adminPage.getByText('出席回数帯は、各メンバーの累計出席回数')).toBeVisible()
    await expect(adminPage.getByTestId('attendance-kpi-attendees')).not.toContainText('unique')
    await screenshot(adminPage, 'TC-11-1-attendance-layout-desktop.png')

    await adminPage.setViewportSize({ width: 390, height: 844 })
    await adminPage.goto('/admin/dashboard/attendance', { waitUntil: 'domcontentloaded' })
    await expect(adminPage.getByRole('heading', { level: 1, name: '出席ダッシュボード' })).toBeVisible()
    await expect(adminPage.getByTestId('attendance-zone-distribution')).toBeVisible()
    await screenshot(adminPage, 'TC-11-6-attendance-narrow-mobile.png')

    await writeFile(
      join(PHASE11_DIR, 'screenshot-inventory.json'),
      JSON.stringify(
        {
          taskId: 'admin-attendance-dashboard-ux',
          mode: 'local-playwright-fixture',
          route: '/admin/dashboard/attendance',
          status: 'captured_local_fixture',
          screenshots: [
            {
              tc: 'TC-11-1',
              file: 'screenshots/TC-11-1-attendance-layout-desktop.png',
              viewport: '1280x800',
              status: 'present',
            },
            {
              tc: 'TC-11-6',
              file: 'screenshots/TC-11-6-attendance-narrow-mobile.png',
              viewport: '390x844',
              status: 'present',
            },
          ],
          runtimeBoundary: 'staging authenticated screenshots remain user-gated',
        },
        null,
        2,
      ),
    )
  })
})
