import { expect, memberLogin, test } from '../../fixtures/auth'

// 公開層は全ルート認証必須化（require-auth-public-access-gate）。会員ログイン済みで撮影する。
test('public top baseline', async ({ page, mockApi }) => {
  void mockApi
  await memberLogin(page.context())
  await page.goto('/')
  await page.locator('main h1').waitFor({ state: 'visible' })
  await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }' })
  await expect(page).toHaveScreenshot('public-top.png', { fullPage: true, maxDiffPixelRatio: 0.02 })
})
