import { expect, memberLogin, test } from '../../fixtures/auth'

// 公開層は全ルート認証必須化（require-auth-public-access-gate）。会員ログイン済みで撮影する。
test('members list baseline', async ({ page, mockApi }) => {
  void mockApi
  await memberLogin(page.context())
  await page.goto('/members')
  await page.locator('main h1').waitFor({ state: 'visible' })
  await page.locator('[data-component="member-card"]').first().waitFor({ state: 'visible' })
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
  })
  await expect(page).toHaveScreenshot('members-list.png', { fullPage: true, maxDiffPixelRatio: 0.02 })
})
