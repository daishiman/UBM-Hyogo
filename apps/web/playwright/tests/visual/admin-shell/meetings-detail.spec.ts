// workflow: admin-visual-baseline-admin-routes-task-e / Phase 5
// env-gated: requires both PLAYWRIGHT_ADMIN_MEMBER_DETAIL_ID and PLAYWRIGHT_ADMIN_MEETING_DETAIL_ID.
import { expect, test } from '@playwright/test'
import { DETAIL_SEEDS, DETAIL_SEEDS_READY, freezeAnimations, waitAdminPageReady } from './_helpers'

test.skip(
  !DETAIL_SEEDS_READY,
  'Both PLAYWRIGHT_ADMIN_MEMBER_DETAIL_ID and PLAYWRIGHT_ADMIN_MEETING_DETAIL_ID are required',
)

test('admin meetings detail staging visual baseline', async ({ page }) => {
  await page.goto(`/admin/meetings/${DETAIL_SEEDS.meetingId}`, { waitUntil: 'networkidle' })
  await waitAdminPageReady(page, 'main h1')
  await freezeAnimations(page)
  await expect(page).toHaveScreenshot('admin-meetings-detail.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.02,
  })
})
