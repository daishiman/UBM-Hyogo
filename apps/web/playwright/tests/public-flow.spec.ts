import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { HomePage } from '../page-objects/HomePage'
import { MembersListPage } from '../page-objects/MembersListPage'
import { MemberDetailPage } from '../page-objects/MemberDetailPage'
import { RegisterPage } from '../page-objects/RegisterPage'

const LEAK_PROBE_EMAIL = 'system+responseEmail@example.test'

async function expectPublicBodyHasNoEmail(page: Page): Promise<void> {
  await expect(page.locator('body')).not.toContainText(LEAK_PROBE_EMAIL)
  await expect(page.locator('body')).not.toContainText(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
}

test.describe('public flow (landing → 一覧 → 詳細 → 登録)', () => {
  test('desktop: full flow', async ({ page }) => {
    const home = new HomePage(page)
    await home.visit()
    await expectPublicBodyHasNoEmail(page)
    await home.screenshot('landing', 'desktop')
    const axe1 = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    expect(axe1.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0)

    const list = new MembersListPage(page)
    await list.visit()
    await expectPublicBodyHasNoEmail(page)
    await list.screenshot('members-list', 'desktop')

    const detail = new MemberDetailPage(page)
    await detail.visit('m-1')
    await detail.assertHeading()
    await expectPublicBodyHasNoEmail(page)
    await detail.screenshot('members-detail', 'desktop')

    const register = new RegisterPage(page)
    await register.visit()
    await register.assertExternalLink()
    await register.screenshot('register', 'desktop')
  })

  test('mobile: full flow', async ({ page }) => {
    const home = new HomePage(page)
    await home.visit()
    await expectPublicBodyHasNoEmail(page)
    await home.screenshot('landing', 'mobile')
    const list = new MembersListPage(page)
    await list.visit()
    await expectPublicBodyHasNoEmail(page)
    await list.screenshot('members-list', 'mobile')
  })
})
