// TODO(08b): 実装は Phase 11 manual smoke で活性化
import { expect } from '../fixtures/coverage'
import { test } from '../fixtures/auth'
import { AdminDashboardPage } from '../page-objects/AdminDashboardPage'
import { AdminMembersPage } from '../page-objects/AdminMembersPage'
import { AdminTagsPage } from '../page-objects/AdminTagsPage'
import { AdminSchemaPage } from '../page-objects/AdminSchemaPage'
import { AdminMeetingsPage } from '../page-objects/AdminMeetingsPage'

const ADMIN_PATHS = ['/admin', '/admin/members', '/admin/tags', '/admin/schema', '/admin/meetings']

test.describe('admin pages × 認可境界 (5 画面 × 3 ロール)', () => {
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
    await tags.assertQueueShell()
    await tags.screenshot('admin-tags', 'desktop')

    const schema = new AdminSchemaPage(adminPage)
    await schema.visit()
    await schema.assertPrototypeAlignedShell()
    await schema.screenshot('admin-schema', 'desktop')

    const meetings = new AdminMeetingsPage(adminPage)
    await meetings.visit()
    await meetings.screenshot('admin-meetings', 'desktop')
  })

  test('member: /admin/* は最終的に /profile へ redirect（middleware→login server-side redirect chain）', async ({ memberPage }) => {
    // 期待挙動: middleware が /login?gate=forbidden へ redirect → /login server component が
    // 認証済 session を検出して safeNext(next) || "/profile" へ redirect。member は
    // 既に認証済のため最終 URL は /profile に固定される（login-redirect-when-authenticated）。
    for (const path of ADMIN_PATHS) {
      await memberPage.goto(path)
      await expect(memberPage).toHaveURL(/\/profile/)
    }
  })

  test('anonymous: /admin/* は /login へ redirect', async ({ anonymousPage }) => {
    for (const path of ADMIN_PATHS) {
      await anonymousPage.goto(path)
      await expect(anonymousPage).toHaveURL(/\/login/)
    }
  })
})
