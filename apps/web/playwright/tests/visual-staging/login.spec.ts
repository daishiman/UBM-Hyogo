import { expect, test } from '@playwright/test'

// /login は静的 chrome（SSR データ依存なし）で design system 検証に最適・最安定。
// staging runtime（OpenNext bundle）の token / rhythm / primitives 描画を確認する。
test('staging login baseline', async ({ page }) => {
  await page.goto('/login')
  await page.locator('main h1').waitFor({ state: 'visible' })
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
  })
  await expect(page).toHaveScreenshot('login.png', { fullPage: true, maxDiffPixelRatio: 0.05 })
})
