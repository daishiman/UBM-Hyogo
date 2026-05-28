// workflow: admin-visual-baseline-admin-routes-task-e / Phase 5
import { expect, test } from '@playwright/test'
import { freezeAnimations, waitAdminPageReady } from './_helpers'

test('admin identity conflicts staging visual baseline', async ({ page }) => {
  await page.goto('/admin/identity-conflicts', { waitUntil: 'networkidle' })
  await waitAdminPageReady(page, 'main h1')
  await freezeAnimations(page)
  await expect(page).toHaveScreenshot('admin-identity-conflicts.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.02,
  })
})
