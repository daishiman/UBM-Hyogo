// TODO(08b): 実装は Phase 11 manual smoke で活性化
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { HomePage } from '../page-objects/HomePage'
import { MembersListPage } from '../page-objects/MembersListPage'
import { MemberDetailPage } from '../page-objects/MemberDetailPage'
import { RegisterPage } from '../page-objects/RegisterPage'

test.describe.skip('public flow (landing → 一覧 → 詳細 → 登録)', () => {
  test('desktop: full flow', async ({ page }) => {
    const home = new HomePage(page)
    await home.visit()
    await home.screenshot('landing', 'desktop')
    const axe1 = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    expect(axe1.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0)

    const list = new MembersListPage(page)
    await list.visit()
    await list.screenshot('members-list', 'desktop')

    const detail = new MemberDetailPage(page)
    await detail.visit('m-1')
    await detail.assertHeading()
    await detail.screenshot('members-detail', 'desktop')

    const register = new RegisterPage(page)
    await register.visit()
    await register.assertExternalLink()
    await register.screenshot('register', 'desktop')
  })

  test('mobile: full flow', async ({ page }) => {
    const home = new HomePage(page)
    await home.visit()
    await home.screenshot('landing', 'mobile')
    const list = new MembersListPage(page)
    await list.visit()
    await list.screenshot('members-list', 'mobile')
  })
})
