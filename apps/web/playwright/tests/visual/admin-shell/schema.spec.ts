// workflow: admin-visual-baseline-admin-routes-task-e / Phase 5
import { expect, test } from '@playwright/test'
import { freezeAnimations, waitAdminPageReady } from './_helpers'

test('admin schema staging visual baseline', async ({ page }) => {
  await page.goto('/admin/schema', { waitUntil: 'networkidle' })
  await waitAdminPageReady(page, 'main h1')
  await freezeAnimations(page)
  await expect(page).toHaveScreenshot('admin-schema.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.02,
  })
})
