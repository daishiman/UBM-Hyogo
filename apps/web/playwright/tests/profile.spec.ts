// TODO(08b): 実装は Phase 11 manual smoke で活性化
import { expect } from '@playwright/test'
import { test } from '../fixtures/auth'
import { ProfilePage } from '../page-objects/ProfilePage'

test.describe.skip('profile (#4 編集 form 不在 / #8 reload 後 session 維持)', () => {
  test('desktop: 編集 form 不在 + editResponseUrl ボタン', async ({ memberPage }) => {
    const profile = new ProfilePage(memberPage)
    await profile.visit()
    await profile.assertNoEditFormVisible() // 不変条件 #4
    await profile.screenshot('profile', 'desktop')
  })

  test('editResponseUrl click → Google Form viewform へ遷移', async ({ memberPage }) => {
    const profile = new ProfilePage(memberPage)
    await profile.visit()
    const popup = await profile.clickEditResponseUrl()
    await popup.waitForLoadState('domcontentloaded')
    expect(popup.url()).toMatch(/docs\.google\.com\/forms.*viewform/)
  })

  test('reload 後 session 維持 (#8)', async ({ memberPage }) => {
    const profile = new ProfilePage(memberPage)
    await profile.visit()
    const before = await profile.userName.textContent()
    await memberPage.reload()
    const after = await profile.userName.textContent()
    expect(after).toBe(before)
    await profile.screenshot('profile-after-reload', 'desktop')
  })
})
