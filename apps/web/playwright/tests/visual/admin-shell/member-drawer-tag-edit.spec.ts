// workflow: issue-982-drawer-tag-pill-editing / task-C / Phase 11 (VISUAL_ON_EXECUTION)
// env-gated: requires PLAYWRIGHT_ADMIN_MEMBER_DETAIL_ID to open a real member drawer.
// baseline 取得は staging 認証が必要なため user-gated（Phase 11）。
import { expect, test } from '@playwright/test'
import { DETAIL_SEEDS, freezeAnimations, waitAdminPageReady } from './_helpers'

test.skip(
  !DETAIL_SEEDS.memberId,
  'PLAYWRIGHT_ADMIN_MEMBER_DETAIL_ID is required to open the member drawer',
)

test('admin member drawer tag edit baseline', async ({ page }) => {
  await page.goto('/admin/members', { waitUntil: 'networkidle' })
  await waitAdminPageReady(page, 'main h1')

  // 先頭 member 行をクリックして drawer を開く
  await page.getByRole('row').nth(1).click()

  // TAGS セクション（編集可能 pill）が表示されるまで待つ
  const tagsSection = page.locator('[aria-labelledby="drawer-tags-heading"]')
  await tagsSection.waitFor({ state: 'visible' })
  await expect(page.getByRole('heading', { name: 'タグ' })).toBeVisible()

  await freezeAnimations(page)
  await expect(tagsSection).toHaveScreenshot('member-drawer-tag-edit.png', {
    maxDiffPixelRatio: 0.02,
  })
})
