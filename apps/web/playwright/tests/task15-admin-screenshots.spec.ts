import { expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { test } from '../fixtures/auth'

const OUT_DIR = '../../docs/30-workflows/task-15-admin-dashboard-and-members/outputs/phase-11'

const screenshot = async (page: import('@playwright/test').Page, file: string) => {
  await mkdir(OUT_DIR, { recursive: true })
  await page.screenshot({ path: join(OUT_DIR, file), fullPage: true })
}

test.describe('task-15 admin dashboard and members screenshots', () => {
  test('captures canonical Phase 11 screenshots', async ({ adminPage, mockApi }) => {
    await adminPage.goto('/admin')
    await expect(adminPage.locator('#admin-dashboard-h')).toBeAttached()
    await expect(adminPage.getByTestId('admin-kpi-card-total')).toBeVisible()
    await screenshot(adminPage, 'admin-dashboard-default.png')

    mockApi.setAdminDashboardUnresolvedSchema(5)
    await adminPage.goto('/admin')
    await expect(adminPage.getByText('スキーマ未解決: 5 件')).toBeVisible()
    await screenshot(adminPage, 'admin-dashboard-schema-alert.png')
    mockApi.setAdminDashboardUnresolvedSchema(0)
    await adminPage.goto('/admin')

    await screenshot(adminPage, 'admin-dashboard-zone-placeholder.png')
    await screenshot(adminPage, 'admin-layout-sidebar-active.png')

    await adminPage.goto('/admin/members')
    await expect(adminPage.locator('#admin-members-h')).toBeAttached()
    await expect(adminPage.getByText('青木 太郎')).toBeVisible()
    await screenshot(adminPage, 'admin-members-default.png')

    await adminPage.goto('/admin/members?filter=published')
    await expect(adminPage.getByLabel('状態')).toHaveValue('published')
    await screenshot(adminPage, 'admin-members-filter-published.png')

    await adminPage.goto('/admin/members')
    await adminPage.getByLabel('青木 太郎 を選択').check()
    await adminPage.getByLabel('兵庫 花子 を選択').check()
    await expect(adminPage.getByRole('region', { name: '一括操作' })).toBeVisible()
    await screenshot(adminPage, 'admin-members-bulk-selected.png')

    await adminPage.getByRole('button', { name: '青木 太郎' }).click()
    await expect(adminPage.getByRole('dialog', { name: '会員詳細' })).toBeVisible()
    await screenshot(adminPage, 'admin-members-drawer-open.png')

    await adminPage.goto('/admin/members?q=zzzzz')
    await expect(adminPage.getByText('該当する会員はいません')).toBeVisible()
    await screenshot(adminPage, 'admin-members-empty.png')

    await writeFile(
      join(OUT_DIR, 'phase11-capture-metadata.json'),
      JSON.stringify(
        {
          taskId: 'task-15-admin-dashboard-and-members',
          mode: 'VISUAL',
          captureDate: '2026-05-10',
          environment: 'local-playwright-fixture',
          screenshots: [
            { id: 'S-01', file: 'admin-dashboard-default.png', route: '/admin', viewport: '1280x800' },
            { id: 'S-02', file: 'admin-dashboard-schema-alert.png', route: '/admin', viewport: '1280x800', fixture: { unresolvedSchema: 5 } },
            { id: 'S-03', file: 'admin-dashboard-zone-placeholder.png', route: '/admin', viewport: '1280x800' },
            { id: 'S-04', file: 'admin-members-default.png', route: '/admin/members', viewport: '1280x800' },
            { id: 'S-05', file: 'admin-members-filter-published.png', route: '/admin/members?filter=published', viewport: '1280x800' },
            { id: 'S-06', file: 'admin-members-bulk-selected.png', route: '/admin/members', viewport: '1280x800' },
            { id: 'S-07', file: 'admin-members-drawer-open.png', route: '/admin/members', viewport: '1280x800' },
            { id: 'S-08', file: 'admin-members-empty.png', route: '/admin/members?q=zzzzz', viewport: '1280x800' },
            { id: 'S-09', file: 'admin-layout-sidebar-active.png', route: '/admin', viewport: '1280x800' },
          ],
        },
        null,
        2,
      ),
    )
  })
})
