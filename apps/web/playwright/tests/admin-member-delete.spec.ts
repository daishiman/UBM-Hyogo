import { expect, test } from '../fixtures/auth'
import type { Page, Route } from '@playwright/test'

const MEMBER_ID = 'mem_001'
const MEMBER_DETAIL_PATTERN = `**/api/admin/members/${MEMBER_ID}`
const MEMBER_DELETE_PATTERN = `**/api/admin/members/${MEMBER_ID}/delete`

const memberDetail = {
  identityMemberId: MEMBER_ID,
  identityEmail: 'active@example.test',
  status: {
    publicConsent: 'consented',
    rulesConsent: 'consented',
    publishState: 'public',
    isDeleted: false,
  },
  profile: {
    memberId: MEMBER_ID,
    responseId: 'res_001',
    responseEmail: 'active@example.test',
    publicConsent: 'consented',
    rulesConsent: 'consented',
    publishState: 'public',
    isDeleted: false,
    summary: {
      fullName: '削除対象 太郎',
      nickname: 'taro',
      location: '兵庫県',
      occupation: '経営者',
      ubmZone: '1',
      ubmMembershipType: '正会員',
    },
    sections: [],
    attendance: [],
    attendanceMeta: { hasMore: false, nextCursor: null },
    tags: [],
    lastSubmittedAt: '2026-05-09T00:00:00.000Z',
    editResponseUrl: 'https://forms.example.test/edit',
  },
  audit: [
    {
      actor: 'admin-1',
      action: 'admin.member.viewed',
      occurredAt: '2026-05-09T00:00:00.000Z',
      note: null,
    },
  ],
}

const fulfillJson =
  (body: unknown, status = 200) =>
  async (route: Route) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })

async function openDeleteDialog(page: Page) {
  await page.route(MEMBER_DETAIL_PATTERN, fulfillJson(memberDetail))
  await page.goto('/admin/members')
  await page.getByRole('button', { name: '詳細' }).first().click()
  const drawer = page.getByTestId('member-drawer')
  await expect(drawer).toBeVisible()
  await drawer.getByRole('button', { name: '論理削除する' }).click()
  const dialog = drawer.getByRole('dialog', { name: '削除確認' })
  await expect(dialog).toBeVisible()
  return dialog
}

test.describe('/admin/members × member delete', () => {
  test('成功系: 詳細 drawer → 二段確認 → reason 付き論理削除', async ({
    adminPage,
  }) => {
    let deleteCalls = 0
    let deleteBody: Record<string, unknown> | null = null

    await adminPage.route(MEMBER_DELETE_PATTERN, async (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      deleteCalls += 1
      deleteBody = route.request().postDataJSON() as Record<string, unknown>
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: MEMBER_ID,
          isDeleted: true,
          deletedAt: '2026-05-10T00:00:00.000Z',
        }),
      })
    })

    const dialog = await openDeleteDialog(adminPage)
    await dialog.getByLabel(/削除理由/).fill('退会希望の確認済み')
    await dialog.getByRole('button', { name: '削除実行' }).click()

    await expect.poll(() => deleteCalls).toBe(1)
    expect(deleteBody).toEqual({ reason: '退会希望の確認済み' })
    await expect(adminPage.getByTestId('member-drawer')).toHaveCount(0)
    await expect(
      adminPage
        .getByRole('row')
        .filter({ hasText: 'active@example.test' })
        .getByText('削除済み'),
    ).toBeVisible()
  })

  // TODO(stage-3): cascade preview API 未実装。Stage 3 で endpoint 実装後に active 化する。
  test.skip('cascade preview（API 未実装・Stage 3 持越し）', async () => {})

  test('失敗系: reason 空では削除実行が disabled で API に到達しない', async ({
    adminPage,
  }) => {
    let deleteCalls = 0
    await adminPage.route(MEMBER_DELETE_PATTERN, async (route) => {
      deleteCalls += 1
      return route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, error: 'reason required' }),
      })
    })

    const dialog = await openDeleteDialog(adminPage)
    const execute = dialog.getByRole('button', { name: '削除実行' })
    await expect(execute).toBeDisabled()
    await dialog.getByLabel(/削除理由/).fill('   ')
    await expect(execute).toBeDisabled()
    expect(deleteCalls).toBe(0)
  })

  test('audit log entry 連動: admin.member.deleted を監査ログで確認できる', async ({
    adminPage,
  }) => {
    let deleteCalls = 0
    await adminPage.route(MEMBER_DELETE_PATTERN, async (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      deleteCalls += 1
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: MEMBER_ID,
          isDeleted: true,
          deletedAt: '2026-05-10T00:00:00.000Z',
        }),
      })
    })

    const dialog = await openDeleteDialog(adminPage)
    await dialog.getByLabel(/削除理由/).fill('監査ログ連動の確認')
    await dialog.getByRole('button', { name: '削除実行' }).click()
    await expect.poll(() => deleteCalls).toBe(1)

    await adminPage.goto('/admin/audit?action=admin.member.deleted')
    await expect(adminPage.getByRole('heading', { name: '監査ログ' })).toBeVisible()
    await expect(adminPage.getByText('admin.member.deleted')).toBeVisible()
    await expect(adminPage.getByText(MEMBER_ID)).toBeVisible()
  })

  test('認可: member は admin 専用画面から login forbidden gate へ redirect', async ({
    memberPage,
  }) => {
    await memberPage.goto('/admin/members').catch(() => {})
    await expect(memberPage).toHaveURL(/\/login/)
    await expect(memberPage.getByRole('heading', { name: '会員管理' })).toHaveCount(0)
    await expect(memberPage.getByRole('button', { name: '論理削除する' })).toHaveCount(0)
  })

  test('認可: anonymous は login へ redirect', async ({ anonymousPage }) => {
    await anonymousPage.goto('/admin/members').catch(() => {})
    await expect(anonymousPage).toHaveURL(/\/login/)
    await expect(anonymousPage.getByRole('heading', { name: '会員管理' })).toHaveCount(0)
  })
})
