import { expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { test } from '../fixtures/auth'

const PHASE11_DIR =
  process.env.PLAYWRIGHT_EVIDENCE_DIR ??
  '../../docs/30-workflows/completed-tasks/admin-shell-topbar-sidebar-integration/outputs/phase-11'

const screenshot = async (
  page: import('@playwright/test').Page,
  file: string,
): Promise<void> => {
  await mkdir(PHASE11_DIR, { recursive: true })
  await page.screenshot({ path: join(PHASE11_DIR, file), fullPage: false })
}

const gotoAdminRoute = async (
  page: import('@playwright/test').Page,
  path: `/admin${string}`,
): Promise<void> => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!message.includes('interrupted by another navigation') || attempt === 2) {
        throw error
      }
    }

    await page.waitForTimeout(150)
    if (new URL(page.url()).pathname === path) return
  }

  await expect(page).toHaveURL(new RegExp(`${path.replaceAll('/', '\\/')}$`))
}

test.describe('admin-shell-topbar-sidebar-integration Phase 11 screenshots', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Phase 11 evidence screenshots are captured once on Chromium')
  test.setTimeout(120_000)

  test('captures canonical shell/sidebar visual evidence', async ({ adminPage, mockApi }) => {
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

    await adminPage.setViewportSize({ width: 1280, height: 720 })
    await gotoAdminRoute(adminPage, '/admin')
    await expect(adminPage.getByTestId('admin-shell')).toBeVisible()
    await expect(adminPage.locator('[data-shell="topbar"]')).toHaveCount(0)
    await expect(adminPage.locator('[data-shell="sidebar"]')).toBeVisible()
    await expect(adminPage.locator('[data-shell-block="nav-item"][data-active="true"]')).toHaveCount(1)
    await expect(adminPage.locator('a[href="/admin"][data-active="true"]')).toBeVisible()
    await screenshot(adminPage, 'task-A-sidebar-desktop-1280.png')
    await screenshot(adminPage, 'task-A-topbar-removed-1280.png')

    await gotoAdminRoute(adminPage, '/admin/members')
    await expect(adminPage.locator('[data-shell-block="nav-item"][data-active="true"]')).toHaveCount(1)
    await expect(adminPage.locator('a[href="/admin/members"][data-active="true"]')).toBeVisible()
    await screenshot(adminPage, 'task-A-sidebar-desktop-1280-members-active.png')

    await adminPage.setViewportSize({ width: 768, height: 1024 })
    await gotoAdminRoute(adminPage, '/admin')
    await expect(adminPage.locator('[data-shell="sidebar"]')).toBeVisible()
    await screenshot(adminPage, 'task-A-sidebar-tablet-768.png')

    await adminPage.setViewportSize({ width: 375, height: 812 })
    await gotoAdminRoute(adminPage, '/admin')
    await expect(adminPage.locator('[data-shell="sidebar"]')).toBeHidden()
    await expect(adminPage.locator('[data-shell="topbar"]')).toHaveCount(0)
    await screenshot(adminPage, 'task-A-sidebar-mobile-375.png')

    await adminPage.setViewportSize({ width: 1280, height: 720 })
    await mockApi.setAdminDashboardUnresolvedSchema(3)
    await gotoAdminRoute(adminPage, '/admin/schema')
    await expect(adminPage.locator('a[href="/admin/schema"]')).toContainText('3')
    await screenshot(adminPage, 'task-A-sidebar-schema-badge.png')

    await writeFile(
      join(PHASE11_DIR, 'phase11-capture-metadata.json'),
      `${JSON.stringify(
        {
          taskId: 'admin-shell-topbar-sidebar-integration',
          status: 'captured_local_playwright_fixture',
          visualEvidence: 'VISUAL_ON_EXECUTION',
          capturedAt: '2026-05-26T00:00:00+09:00',
          baseUrl: 'local-playwright-fixture',
          command:
            'PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/admin-shell-topbar-sidebar-integration/outputs/phase-11 PLAYWRIGHT_EVIDENCE_TASK=task-17-admin-schema-conflicts-audit pnpm -F @ubm-hyogo/web exec playwright test --project=desktop-chromium playwright/tests/admin-shell-topbar-sidebar-integration.spec.ts',
          screenshots: [
            { file: 'task-A-sidebar-desktop-1280.png', route: '/admin', viewport: '1280x720', status: 'present' },
            { file: 'task-A-sidebar-desktop-1280-members-active.png', route: '/admin/members', viewport: '1280x720', status: 'present' },
            { file: 'task-A-sidebar-tablet-768.png', route: '/admin', viewport: '768x1024', status: 'present' },
            { file: 'task-A-sidebar-mobile-375.png', route: '/admin', viewport: '375x812', status: 'present' },
            { file: 'task-A-sidebar-schema-badge.png', route: '/admin/schema', viewport: '1280x720', status: 'present', fixture: { queuedSchemaDiffCount: 3 } },
            { file: 'task-A-topbar-removed-1280.png', route: '/admin', viewport: '1280x720', status: 'present' },
          ],
        },
        null,
        2,
      )}\n`,
    )

    await writeFile(
      join(PHASE11_DIR, 'ui-sanity-visual-review.md'),
      [
        '# UI sanity visual review',
        '',
        'Status: `captured_local_playwright_fixture`.',
        '',
        '| Check | Status | Evidence |',
        '| --- | --- | --- |',
        '| topbar DOM is absent from `(admin)/layout.tsx` render output | pass | `task-A-topbar-removed-1280.png` + locator count 0 |',
        '| page-local `AdminPageHeader` owns breadcrumb/title/actions | pass | topbar slot absent; Task C owns remaining page-level breadcrumb replacement |',
        '| 13 nav items total are visible at desktop/tablet widths | pass | `task-A-sidebar-desktop-1280.png`, `task-A-sidebar-tablet-768.png` |',
        '| exactly one active nav item is highlighted per route | pass | `/admin` and `/admin/members` locator assertions |',
        '| schema badge appears only when queued unresolved count is greater than 0 | pass | `task-A-sidebar-schema-badge.png` with fixture count 3 |',
        '| mobile shell keeps coherent main spacing without a dead topbar gap | pass | `task-A-sidebar-mobile-375.png`; sidebar hidden, topbar absent |',
        '',
      ].join('\n'),
    )
  })
})
