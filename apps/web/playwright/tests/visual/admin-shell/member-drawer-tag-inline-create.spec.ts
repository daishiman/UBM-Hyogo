// workflow: issue-1068-admin-tag-inline-create-ui / task-C / Phase 11 (VISUAL_ON_EXECUTION)
// env-gated: requires PLAYWRIGHT_ADMIN_MEMBER_DETAIL_ID to open a real member drawer.
// baseline 取得は staging 認証が必要なため user-gated（Phase 11）。
// AC-6: desktop / mobile drawer で inline-create の操作部品（ボタン / 入力 / 送信 / キャンセル）と
//       tag pill が重ならないことを視覚的に確認する。
import { expect, test } from '@playwright/test'
import { DETAIL_SEEDS, freezeAnimations, waitAdminPageReady } from './_helpers'

test.skip(
  !DETAIL_SEEDS.memberId,
  'PLAYWRIGHT_ADMIN_MEMBER_DETAIL_ID is required to open the member drawer',
)

async function openDrawerTags(page: import('@playwright/test').Page) {
  await page.goto('/admin/members', { waitUntil: 'networkidle' })
  await waitAdminPageReady(page, 'main h1')
  // 先頭 member 行をクリックして drawer を開く
  await page.getByRole('row').nth(1).click()
  const tagsSection = page.locator('[aria-labelledby="drawer-tags-heading"]')
  await tagsSection.waitFor({ state: 'visible' })
  await expect(page.getByRole('heading', { name: 'タグ' })).toBeVisible()
  return tagsSection
}

test.describe('admin member drawer tag inline-create (issue-1068)', () => {
  test('desktop: inline-create form open baseline', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const tagsSection = await openDrawerTags(page)

    // 「+ 新規タグ」→ create フォーム展開
    await page.getByTestId('tag-inline-create-open').click()
    await page.getByTestId('tag-inline-create-form').waitFor({ state: 'visible' })
    // フォーム入力欄と既存 pill が同時に見える（重ならず縦に並ぶ）
    await expect(page.getByLabel('コード')).toBeVisible()

    await freezeAnimations(page)
    await expect(tagsSection).toHaveScreenshot('member-tag-inline-create-form-desktop.png', {
      maxDiffPixelRatio: 0.02,
    })
  })

  test('mobile: inline-create form open baseline', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const tagsSection = await openDrawerTags(page)

    await page.getByTestId('tag-inline-create-open').click()
    await page.getByTestId('tag-inline-create-form').waitFor({ state: 'visible' })
    await expect(page.getByLabel('コード')).toBeVisible()

    await freezeAnimations(page)
    await expect(tagsSection).toHaveScreenshot('member-tag-inline-create-form-mobile.png', {
      maxDiffPixelRatio: 0.02,
    })
  })
})
