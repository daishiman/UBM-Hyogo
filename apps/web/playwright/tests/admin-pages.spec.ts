// TODO(08b): 実装は Phase 11 manual smoke で活性化
import { expect } from '@playwright/test'
import { test } from '../fixtures/auth'
import { AdminDashboardPage } from '../page-objects/AdminDashboardPage'
import { AdminMembersPage } from '../page-objects/AdminMembersPage'
import { AdminTagsPage } from '../page-objects/AdminTagsPage'
import { AdminSchemaPage } from '../page-objects/AdminSchemaPage'
import { AdminMeetingsPage } from '../page-objects/AdminMeetingsPage'

const ADMIN_PATHS = ['/admin', '/admin/members', '/admin/tags', '/admin/schema', '/admin/meetings']

test.describe.skip('admin pages × 認可境界 (5 画面 × 3 ロール)', () => {
  test('admin: 5 画面すべてアクセス可能 + screenshot', async ({ adminPage }) => {
    const dash = new AdminDashboardPage(adminPage)
    await dash.visit()
    await dash.assertCards()
    await dash.screenshot('admin-dashboard', 'desktop')

    const members = new AdminMembersPage(adminPage)
    await members.visit()
    await members.screenshot('admin-members', 'desktop')

    const tags = new AdminTagsPage(adminPage)
    await tags.visit()
    await tags.screenshot('admin-tags', 'desktop')

    const schema = new AdminSchemaPage(adminPage)
    await schema.visit()
    await schema.assertSectionCount(6)
    await schema.screenshot('admin-schema', 'desktop')

    const meetings = new AdminMeetingsPage(adminPage)
    await meetings.visit()
    await meetings.screenshot('admin-meetings', 'desktop')
  })

  test('member: /admin/* は 403', async ({ memberPage }) => {
    for (const path of ADMIN_PATHS) {
      const res = await memberPage.goto(path)
      expect(res?.status()).toBe(403)
    }
  })

  test('anonymous: /admin/* は /login へ redirect', async ({ anonymousPage }) => {
    for (const path of ADMIN_PATHS) {
      await anonymousPage.goto(path)
      await expect(anonymousPage).toHaveURL(/\/login/)
    }
  })
})
