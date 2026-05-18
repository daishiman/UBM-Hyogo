import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import AxeBuilder from '@axe-core/playwright'
import { expect } from '@playwright/test'
import { test } from '../fixtures/auth'

const screenshotDir =
  process.env.PLAYWRIGHT_SCREENSHOT_DIR ??
  '../../docs/30-workflows/admin-tags-queue-resolver-drawer/outputs/phase-11/screenshots'
const logDir = process.env.PLAYWRIGHT_LOG_DIR ?? join(dirname(screenshotDir), 'logs')

async function capture(page: import('@playwright/test').Page, name: string) {
  const filePath = join(screenshotDir, name)
  await mkdir(dirname(filePath), { recursive: true })
  await page.screenshot({ path: filePath, fullPage: true })
}

test.describe('admin tags resolve drawer evidence', () => {
  test('captures the five Phase 11 drawer states', async ({ adminPage }) => {
    await adminPage.goto('/admin/tags')
    await expect(adminPage.getByRole('heading', { name: 'タグキュー' })).toBeVisible()
    await capture(adminPage, 'admin-tags-drawer-closed.png')

    await adminPage.getByRole('button', { name: /^mem_alpha/ }).click()
    await adminPage
      .getByTestId('admin-tag-review-panel')
      .getByRole('button', { name: 'resolve' })
      .click()
    await expect(adminPage.getByRole('dialog', { name: /キュー解決/ })).toBeVisible()
    await capture(adminPage, 'admin-tags-drawer-confirmed-open.png')

    await adminPage.getByLabel('却下').click()
    await expect(adminPage.getByLabel(/却下理由/)).toBeVisible()
    await capture(adminPage, 'admin-tags-drawer-rejected-open.png')

    await adminPage.getByLabel('承認').click()
    for (const checkbox of await adminPage.getByRole('checkbox').all()) {
      if (await checkbox.isChecked()) {
        await checkbox.click()
      }
    }
    await adminPage.getByRole('button', { name: '送信' }).click()
    await expect(adminPage.getByTestId('admin-tag-resolve-error')).toContainText('少なくとも')
    await capture(adminPage, 'admin-tags-drawer-validation-error.png')

    await adminPage.keyboard.press('Escape')
    await adminPage.getByRole('button', { name: /^mem_beta/ }).click()
    await adminPage
      .getByTestId('admin-tag-review-panel')
      .getByRole('button', { name: 'resolve' })
      .click()
    const submit = adminPage.getByRole('button', { name: '送信' })
    await expect(submit).toBeDisabled()
    await capture(adminPage, 'admin-tags-drawer-terminal-disabled.png')

    const axe = await new AxeBuilder({ page: adminPage }).analyze()
    await mkdir(logDir, { recursive: true })
    await writeFile(join(logDir, 'axe.json'), JSON.stringify(axe.violations, null, 2))
    expect(axe.violations).toEqual([])
  })
})
