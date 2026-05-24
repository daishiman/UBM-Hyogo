import { expect, test } from '@playwright/test'

// production-equivalent runtime（Cloudflare Workers staging）の visual baseline。
// baseURL は staging-visual project（PLAYWRIGHT_STAGING_BASE_URL）。
// page.route() はブラウザの client-side fetch のみ intercept する。SSR（Worker サーバー fetch）は
// 差し替え不可で実 staging API 由来になる（index.md §0.3 / phase-04 §5）。検証対象は
// OpenNext bundle の design system 描画が local と等価かどうかであり、API データ内容ではない。
test('staging public top baseline', async ({ page }) => {
  // client-side 動的 fetch の安定化（SSR は staging 実値のまま）
  await page.route('**/api/**', (route) => route.continue())
  await page.goto('/')
  await page.locator('main h1').waitFor({ state: 'visible' })
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
  })
  await expect(page).toHaveScreenshot('public-top.png', { fullPage: true, maxDiffPixelRatio: 0.05 })
})
