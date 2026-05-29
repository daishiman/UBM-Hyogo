import { expect, test } from '@playwright/test'

// workflow: admin-audit-prototype-alignment / Task A
// staging では未認証 admin guard 画面が描画される。本 spec はその guard 描画を
// production-equivalent evidence として取得する（authenticated baseline は別 spec で扱う）。
test('staging admin audit (unauthenticated guard) baseline', async ({ page }) => {
  await page.goto('/admin/audit')
  await page.locator('main h1').waitFor({ state: 'visible' })
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
  })
  await expect(page).toHaveScreenshot('admin-audit.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.05,
  })
})
