import { adminLogin, expect, memberLogin, test } from '../../fixtures/auth'
import { VISUAL_ROUTES } from '../../fixtures/visual-routes'

for (const route of VISUAL_ROUTES) {
  test.describe(`visual: ${route.slug}`, () => {
    test(`${route.slug}`, async ({ page, context, mockApi }, testInfo) => {
      void mockApi

      if (route.auth === 'admin') {
        await adminLogin(context)
      } else if (route.auth === 'member') {
        await memberLogin(context)
      }

      await page.goto(route.path)
      expect(new URL(page.url()).pathname).toBe(route.path.split('?')[0])
      await page.waitForLoadState('networkidle')
      await page.evaluate(() => document.fonts?.ready)
      await page.addStyleTag({
        content:
          '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important;}',
      })

      const viewport = testInfo.project.name.replace('visual-full-chromium-', '')
      await expect(page).toHaveScreenshot(`full-visual-${route.slug}-${viewport}.png`, {
        fullPage: true,
        animations: 'disabled',
        caret: 'hide',
        scale: 'css',
        mask: [page.locator('[data-visual-mask]'), page.locator('time')],
      })
    })
  })
}
