import { expect, test } from '@playwright/test'

// staging では未認証のため admin guard / redirect 画面が描画される。
// 本 spec はその未認証 guard / redirect 描画（admin shell の design system）を
// production-equivalent evidence とする（index.md §0.3 / phase-04 §3.4）。
// 認証後の admin dashboard 実データ描画は本タスクスコープ外（phase-09 §5 フォロー候補）。
test('staging admin dashboard (unauthenticated guard) baseline', async ({ page }) => {
  await page.goto('/admin')
  await page.locator('main h1').waitFor({ state: 'visible' })
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
  })
  await expect(page).toHaveScreenshot('admin-dashboard.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.05,
  })
})
