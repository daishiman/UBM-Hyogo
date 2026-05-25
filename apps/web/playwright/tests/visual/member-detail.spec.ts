import { expect, test } from '../../fixtures/auth'

test('member detail baseline', async ({ page, mockApi }) => {
  void mockApi
  await page.goto('/members/sample-001')
  await page.locator('[data-page="public-member-detail"]').waitFor({ state: 'visible' })
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
  })
  await expect(page).toHaveScreenshot('member-detail.png', { fullPage: true, maxDiffPixelRatio: 0.02 })
})
