// task-spec-2a: /admin/requests admin mutation flow + 認可境界 E2E
// 設計正本: docs/30-workflows/task-spec-2a-admin-requests-e2e/{phase-2.md, phase-5.md, phase-6.md}
// 不変条件: 既存 API endpoint surface のみ・page.route() mock 限定・新 fixture 追加なし。
import { expect } from '../fixtures/coverage'
import { test } from '../fixtures/auth'

const API_RESOLVE_PATTERN = '**/api/admin/requests/*/resolve'

test.describe('/admin/requests × admin mutation flow', () => {
  test.describe('admin role', () => {
    test('成功系: pending list 表示', async ({ adminPage }) => {
      await adminPage.goto('/admin/requests')
      await expect(adminPage.getByRole('heading', { name: /依頼キュー/ })).toBeVisible()
      const list = adminPage.getByRole('list', { name: /依頼一覧/ })
      await expect(list.getByRole('listitem')).toHaveCount(3)
      await expect(adminPage.getByText('pending')).toBeVisible()
    })

    test('成功系: approve', async ({ adminPage }) => {
      let postBody: Record<string, unknown> | null = null
      await adminPage.route(API_RESOLVE_PATTERN, async (route) => {
        if (route.request().method() !== 'POST') return route.fallback()
        postBody = route.request().postDataJSON() as Record<string, unknown>
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, noteId: 'req_001', requestStatus: 'resolved' }),
        })
      })
      await adminPage.goto('/admin/requests')
      await adminPage.getByRole('button', { name: /承認する/ }).click()
      await adminPage.getByRole('dialog').getByRole('button', { name: /承認を実行/ }).click()
      await expect.poll(() => postBody).not.toBeNull()
      expect(postBody).toMatchObject({ resolution: 'approve' })
      expect(Object.keys(postBody ?? {}).filter((k) => k === 'resolution')).toHaveLength(1)
      await expect(adminPage.getByText('req_001')).toHaveCount(0)
    })

    test('成功系: reject + reason 提供', async ({ adminPage }) => {
      let postCalls = 0
      let postBody: Record<string, unknown> | null = null
      await adminPage.route(API_RESOLVE_PATTERN, async (route) => {
        if (route.request().method() !== 'POST') return route.fallback()
        postCalls += 1
        postBody = route.request().postDataJSON() as Record<string, unknown>
        const note = (postBody as { resolutionNote?: string }).resolutionNote
        if (!note || note.trim() === '') {
          return route.fulfill({
            status: 422,
            contentType: 'application/json',
            body: JSON.stringify({ ok: false, error: 'resolution_note_required' }),
          })
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, noteId: 'req_001', requestStatus: 'rejected' }),
        })
      })
      await adminPage.goto('/admin/requests')
      await adminPage.getByRole('button', { name: /却下する/ }).click()
      const dialog = adminPage.getByRole('dialog')
      await expect(dialog).toBeVisible()
      await dialog.getByRole('button', { name: /却下を実行/ }).click()
      await expect(dialog.getByRole('alert')).toContainText(/却下理由/)
      expect(postCalls).toBe(0)
      await dialog.getByRole('textbox').fill('spam')
      await dialog.getByRole('button', { name: /却下を実行/ }).click()
      await expect.poll(() => postCalls).toBeGreaterThanOrEqual(1)
      expect(postBody).toMatchObject({ resolution: 'reject', resolutionNote: 'spam' })
    })

    test('失敗系: stale approve は 409', async ({ adminPage }) => {
      let calls = 0
      await adminPage.route(API_RESOLVE_PATTERN, async (route) => {
        if (route.request().method() !== 'POST') return route.fallback()
        calls += 1
        return route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: false,
            error: 'already_resolved',
            currentStatus: 'resolved',
          }),
        })
      })
      await adminPage.goto('/admin/requests')
      await adminPage.getByRole('button', { name: /承認する/ }).click()
      await adminPage.getByRole('dialog').getByRole('button', { name: /承認を実行/ }).click()
      await expect.poll(() => calls).toBe(1)
      const notice = adminPage.getByText(/既に処理済み|already_resolved/i)
      const alert = adminPage.getByRole('status').or(adminPage.getByRole('alert'))
      await expect(notice.or(alert).first()).toBeVisible()
    })
  })

  test.describe('authorization boundary', () => {
    test('認可: member は /login?gate=admin_required redirect', async ({ memberPage }) => {
      await memberPage.goto('/admin/requests').catch(() => {})
      await expect(memberPage.locator('body')).toBeVisible()
      await expect(memberPage).toHaveURL(/\/login/)
      await expect(memberPage.getByRole('button', { name: /承認する/ })).toHaveCount(0)
      await expect(memberPage.getByRole('button', { name: /却下する/ })).toHaveCount(0)
    })

    test('認可: anonymous は /login redirect', async ({ anonymousPage }) => {
      await anonymousPage.goto('/admin/requests').catch(() => {})
      await expect(anonymousPage).toHaveURL(/\/login/)
      await expect(anonymousPage.getByRole('button', { name: /承認する/ })).toHaveCount(0)
    })
  })
})
