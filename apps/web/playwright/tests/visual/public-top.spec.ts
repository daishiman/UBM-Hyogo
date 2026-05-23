import { expect, test } from '../../fixtures/auth'

test('public top baseline', async ({ page, mockApi }) => {
  void mockApi
  await page.goto('/')
  await page.locator('main h1').waitFor({ state: 'visible' })
  await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }' })
  await expect(page).toHaveScreenshot('public-top.png', { fullPage: true, maxDiffPixelRatio: 0.02 })
})
