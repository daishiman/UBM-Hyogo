import { expect, test } from '@playwright/test'

// workflow: docs/30-workflows/completed-tasks/admin-requests-prototype-alignment-and-404-fix
// production-equivalent runtime (Cloudflare Workers staging) visual baseline.
// staging では未認証のため admin guard / redirect 画面が描画される。
// 認証後の `/admin/requests` 実描画は別 spec で実装する。
test('staging admin requests (visibility, unauthenticated guard) baseline', async ({
  page,
}) => {
  await page.route('**/api/**', (route) => route.continue())
  await page.goto('/admin/requests?type=visibility_request')
  await page.locator('main h1').waitFor({ state: 'visible' })
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
  })
  await expect(page).toHaveScreenshot('admin-requests-visibility-empty.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.05,
  })
})

test('staging admin requests (delete, unauthenticated guard) baseline', async ({
  page,
}) => {
  await page.route('**/api/**', (route) => route.continue())
  await page.goto('/admin/requests?type=delete_request')
  await page.locator('main h1').waitFor({ state: 'visible' })
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
  })
  await expect(page).toHaveScreenshot('admin-requests-delete-empty.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.05,
  })
})
