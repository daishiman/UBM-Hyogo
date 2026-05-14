import { expect, memberLogin, test } from '../../fixtures/auth'

test('profile baseline', async ({ page, context, mockApi }) => {
  void mockApi
  await memberLogin(context)
  await page.goto('/profile')
  await page.locator('main h1').waitFor({ state: 'visible' })
  await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }' })
  await expect(page).toHaveScreenshot('profile.png', { fullPage: true, maxDiffPixelRatio: 0.02 })
})
