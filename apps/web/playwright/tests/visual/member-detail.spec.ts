import { expect, test } from '../../fixtures/auth'
import { buildMember } from '../../../src/test-utils/fixtures/public'

test('member detail baseline', async ({ page, mockApi }) => {
  void mockApi
  const member = buildMember()
  await page.goto(`/members/${member.memberId}`)
  await page.locator('[data-page="public-member-detail"]').waitFor({ state: 'visible' })
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
  })
  await expect(page).toHaveScreenshot('member-detail.png', { fullPage: true, maxDiffPixelRatio: 0.02 })
})
