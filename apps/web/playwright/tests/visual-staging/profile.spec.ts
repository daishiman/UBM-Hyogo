import { expect, test } from '@playwright/test'

// staging では未認証のため middleware redirect / guard 画面が描画される。
// 本 spec はその未認証 guard / redirect 先（/login）の design system 描画を
// production-equivalent evidence とする（index.md §0.3 / phase-04 §3.3）。
// 認証後の profile 実データ描画は別 spec で実装:
//   apps/web/playwright/tests/visual-staging-authenticated/profile-authenticated.spec.ts
//   workflow: docs/30-workflows/issue-901-authenticated-profile-admin-staging-visual/
test('staging profile (unauthenticated guard) baseline', async ({ page }) => {
  await page.goto('/profile')
  await page.locator('main h1').waitFor({ state: 'visible' })
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
  })
  await expect(page).toHaveScreenshot('profile.png', { fullPage: true, maxDiffPixelRatio: 0.05 })
})
