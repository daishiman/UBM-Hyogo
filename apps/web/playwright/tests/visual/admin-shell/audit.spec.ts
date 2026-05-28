// workflow: admin-visual-baseline-admin-routes-task-e / Phase 5
import { expect, test } from '@playwright/test'
import { freezeAnimations, waitAdminPageReady } from './_helpers'

test('admin audit staging visual baseline', async ({ page }) => {
  await page.goto('/admin/audit', { waitUntil: 'networkidle' })
  await waitAdminPageReady(page, 'main h1')
  await freezeAnimations(page)
  await expect(page).toHaveScreenshot('admin-audit.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.02,
  })
})
