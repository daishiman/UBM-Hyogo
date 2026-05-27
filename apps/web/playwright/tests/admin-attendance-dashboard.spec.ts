import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

import { expect } from '../fixtures/coverage'
import { test } from '../fixtures/auth'

const SCREENSHOT_DIR = join(
  process.cwd(),
  '../../docs/30-workflows/completed-tasks/admin-ui-task-d-attendance-primitive-conformance/outputs/phase-11/screenshots',
)

async function capture(
  page: import('@playwright/test').Page,
  name: string,
): Promise<string> {
  await mkdir(SCREENSHOT_DIR, { recursive: true })
  const path = join(SCREENSHOT_DIR, name)
  await page.screenshot({ path, fullPage: true })
  return path
}

test.describe('admin-ui-task-d attendance dashboard visual evidence', () => {
  test('captures all-ok primitive layout', async ({ adminPage, mockApi }) => {
    await mockApi.setAttendanceDashboardScenario('all-ok')
    await adminPage.goto('/admin/dashboard/attendance')

    await expect(adminPage.getByRole('heading', { name: '出席分析' })).toBeVisible()
    await expect(adminPage.getByTestId('attendance-overview')).toBeVisible()
    await expect(adminPage.getByTestId('attendance-by-session')).toBeVisible()
    await expect(adminPage.getByTestId('attendance-ranking')).toBeVisible()

    await capture(adminPage, 'attendance-all-ok.png')
  })

  test('captures overview fail-soft state', async ({ adminPage, mockApi }) => {
    await mockApi.setAttendanceDashboardScenario('overview-error')
    await adminPage.goto('/admin/dashboard/attendance')

    await expect(adminPage.getByText('出席サマリー')).toBeVisible()
    await expect(adminPage.getByTestId('attendance-by-session')).toBeVisible()
    await expect(adminPage.getByTestId('attendance-ranking')).toBeVisible()

    await capture(adminPage, 'attendance-overview-error.png')
  })

  test('captures by-session empty state', async ({ adminPage, mockApi }) => {
    await mockApi.setAttendanceDashboardScenario('by-session-empty')
    await adminPage.goto('/admin/dashboard/attendance')

    await expect(adminPage.getByText('セッション別出席データがありません')).toBeVisible()
    await expect(adminPage.getByTestId('attendance-ranking')).toBeVisible()

    await capture(adminPage, 'attendance-by-session-empty.png')
  })
})
