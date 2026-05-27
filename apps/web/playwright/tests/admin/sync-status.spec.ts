import { mkdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { expect } from '@playwright/test'
import { test } from '../../fixtures/auth'

const workflowRoot = resolve(
  process.cwd().endsWith('/apps/web') ? '../..' : '.',
  'docs/30-workflows/google-form-reflection-diagnostics',
)
const screenshotDir = join(workflowRoot, 'outputs/phase-11/screenshots')

async function capture(page: import('@playwright/test').Page, name: string) {
  const filePath = join(screenshotDir, name)
  await mkdir(dirname(filePath), { recursive: true })
  await page.screenshot({ path: filePath, fullPage: true })
}

test.describe('google form reflection diagnostics smoke', () => {
  test.skip(process.env.STAGING_SMOKE !== '1', 'STAGING_SMOKE=1 enables runtime evidence capture')

  test('captures sync status and member diagnosis screenshots', async ({ adminPage }) => {
    await adminPage.goto('/admin/sync-status')
    await expect(adminPage.getByRole('heading', { name: 'Google Form 反映診断' })).toBeVisible()
    await expect(adminPage.getByText('H1 ingest')).toBeVisible()
    await expect(adminPage.getByText('H2 identity')).toBeVisible()
    await expect(adminPage.getByText('H3 visibility')).toBeVisible()
    await expect(adminPage.getByText('H4 alias')).toBeVisible()
    await capture(adminPage, 'sync-status-screen.png')

    await adminPage.goto('/admin/members')
    await adminPage.getByRole('button', { name: '青木 太郎' }).click()
    await expect(adminPage.getByRole('dialog')).toBeVisible()
    await expect(adminPage.getByText('diagnostics')).toBeVisible()
    await expect(adminPage.getByText('response fields')).toBeVisible()
    await capture(adminPage, 'member-diag-drawer.png')
  })
})
