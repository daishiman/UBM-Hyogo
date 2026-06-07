import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, test } from '../fixtures/auth'

const PHASE11_DIR =
  '../../docs/30-workflows/issue-1101-attendance-analytics-calc-correction/outputs/phase-11'
const SCREENSHOT_DIR = join(PHASE11_DIR, 'screenshots')

const screenshot = async (page: import('@playwright/test').Page, file: string) => {
  await mkdir(SCREENSHOT_DIR, { recursive: true })
  try {
    await page.addStyleTag({
      content:
        'nextjs-portal, [data-nextjs-toast], [data-nextjs-dialog-overlay], [data-nextjs-dialog] { display: none !important; }',
    })
  } catch {
    // Cosmetic overlay suppression only; CSP rejection must not hide functional evidence.
  }
  await page.screenshot({ path: join(SCREENSHOT_DIR, file), fullPage: true })
}

test.describe('issue #1101 attendance analytics calculation correction evidence', () => {
  test('captures local desktop and mobile evidence for unique KPI and zone labels', async ({
    adminPage,
    mockApi,
  }) => {
    await mockApi.setAttendanceDashboardScenario('all-ok')

    await adminPage.setViewportSize({ width: 1280, height: 800 })
    await adminPage.goto('/admin/dashboard/attendance', { waitUntil: 'domcontentloaded' })
    await expect(adminPage.getByRole('heading', { level: 1, name: '出席ダッシュボード' })).toBeVisible()
    await expect(adminPage.getByTestId('attendance-kpi-unique')).toContainText('期間内出席者数')
    await expect(adminPage.getByTestId('attendance-kpi-unique')).toContainText('24')
    await expect(adminPage.getByTestId('attendance-kpi-unique')).toContainText('80.0%')
    await expect(
      adminPage.getByTestId('attendance-zone-distribution').getByText('100 回以上', { exact: true }),
    ).toBeVisible()
    await screenshot(adminPage, 'TC-11-issue1101-attendance-analytics-desktop.png')

    await adminPage.setViewportSize({ width: 390, height: 844 })
    await adminPage.goto('/admin/dashboard/attendance', { waitUntil: 'domcontentloaded' })
    await expect(adminPage.getByTestId('attendance-kpi-unique')).toBeVisible()
    await expect(adminPage.getByTestId('attendance-zone-distribution')).toBeVisible()
    await screenshot(adminPage, 'TC-11-issue1101-attendance-analytics-mobile.png')

    await writeFile(
      join(PHASE11_DIR, 'screenshot-inventory.json'),
      JSON.stringify(
        {
          taskId: 'issue-1101-attendance-analytics-calc-correction',
          mode: 'local-playwright-fixture',
          route: '/admin/dashboard/attendance',
          status: 'captured_local_fixture',
          screenshots: [
            {
              tc: 'TC-11-issue1101-desktop',
              file: 'screenshots/TC-11-issue1101-attendance-analytics-desktop.png',
              viewport: '1280x800',
              status: 'present',
            },
            {
              tc: 'TC-11-issue1101-mobile',
              file: 'screenshots/TC-11-issue1101-attendance-analytics-mobile.png',
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
