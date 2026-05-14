import { adminLogin, expect, test } from '../../fixtures/auth'

test('admin dashboard baseline', async ({ page, context, mockApi }) => {
  void mockApi
  await adminLogin(context)
  await page.goto('/admin')
  await page.locator('[aria-labelledby="admin-dashboard-h"]').waitFor({ state: 'visible' })
  await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }' })
  await expect(page).toHaveScreenshot('admin-dashboard.png', { fullPage: true, maxDiffPixelRatio: 0.02 })
})
