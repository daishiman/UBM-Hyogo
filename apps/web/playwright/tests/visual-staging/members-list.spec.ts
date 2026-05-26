import { expect, test } from '@playwright/test'

// production-equivalent runtime (Cloudflare Workers staging) visual baseline.
// SSR data stays sourced from staging; route() only stabilizes browser-side fetches.
test('staging members list (initial view) baseline', async ({ page }) => {
  await page.route('**/api/**', (route) => route.continue())
  await page.goto('/members')
  await page.locator('main h1').waitFor({ state: 'visible' })
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
  })
  await expect(page).toHaveScreenshot('members-list.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.05,
  })
})
