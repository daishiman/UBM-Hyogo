// workflow: admin-visual-baseline-admin-routes-task-e / Phase 5
import { expect, test } from '@playwright/test'
import { freezeAnimations, waitAdminPageReady } from './_helpers'

test('admin meetings list staging visual baseline', async ({ page }) => {
  await page.goto('/admin/meetings', { waitUntil: 'networkidle' })
  await waitAdminPageReady(page, 'main h1')
  await freezeAnimations(page)
  await expect(page).toHaveScreenshot('admin-meetings-list.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.02,
  })
})
