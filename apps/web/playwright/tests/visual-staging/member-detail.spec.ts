import { expect, test } from '@playwright/test'

const memberId = process.env.PLAYWRIGHT_MEMBER_DETAIL_ID ?? ''

// Dynamic member detail routes need a stable staging representative. The env gate
// prevents a missing seed from turning the baseline into a misleading 404 snapshot.
test('staging member detail baseline', async ({ page }) => {
  test.skip(!memberId, 'PLAYWRIGHT_MEMBER_DETAIL_ID is not set; skipping member-detail baseline')

  await page.route('**/api/**', (route) => route.continue())
  await page.goto(`/members/${memberId}`)
  await page.locator('main h1').waitFor({ state: 'visible' })
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
  })
  await expect(page).toHaveScreenshot('member-detail.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.05,
  })
})
