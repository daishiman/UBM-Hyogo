// workflow: admin-visual-baseline-admin-routes-task-e / Phase 5
import { expect, test } from '@playwright/test'
import { freezeAnimations, waitAdminPageReady } from './_helpers'

test('admin dashboard staging visual baseline', async ({ page }) => {
  await page.goto('/admin', { waitUntil: 'networkidle' })
  await waitAdminPageReady(page, '[aria-labelledby="admin-dashboard-h"]')
  await freezeAnimations(page)
  await expect(page).toHaveScreenshot('admin-dashboard.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.02,
  })
})
