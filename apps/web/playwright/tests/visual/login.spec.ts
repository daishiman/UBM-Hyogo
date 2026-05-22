import { expect, test } from '@playwright/test'

test('login baseline', async ({ page }) => {
  await page.goto('/login')
  await page.locator('main h1').waitFor({ state: 'visible' })
  await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }' })
  await expect(page).toHaveScreenshot('login.png', { fullPage: true, maxDiffPixelRatio: 0.02 })
})
