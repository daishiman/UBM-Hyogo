// 2b-admin-identity-conflicts-spec: /admin/identity-conflicts admin mutation flow + 認可境界 E2E
// 設計正本: docs/30-workflows/2b-admin-identity-conflicts-spec/{phase-3.md, phase-5.md, phase-6.md, phase-7.md}
// 不変条件:
//   - 既存 API endpoint surface のみ利用 (GET list / POST merge / POST dismiss)
//   - browser `page.route()` mock のみ。`apps/web` から D1 直接アクセス禁止
//   - 初期一覧の GET は server-side fetch のため、server-fetch.ts の inline fixture で供給
//     (PLAYWRIGHT_ADMIN_IDENTITY_CONFLICTS_FIXTURE=1)
//   - 新 fixture 追加禁止 (auth.ts の adminPage / memberPage / anonymousPage のみ)
//   - merge response は `targetMemberId` 系で固定 (legacy 命名の文字列は禁止 / drift gate G1)
//   - selector は getByRole / getByText / getByTestId 優先 (Tailwind class / 色値依存禁止)
import { expect, test } from '../fixtures/auth'
import {
  MergeIdentityRequestZ,
  DismissIdentityConflictRequestZ,
} from '@ubm-hyogo/shared'

const MERGE_PATTERN = '**/api/admin/identity-conflicts/*/merge'
const DISMISS_PATTERN = '**/api/admin/identity-conflicts/*/dismiss'
const MEMBER_DETAIL_PATTERN = '**/api/admin/members/*'

const mergeResponse = {
  mergedAt: '2026-05-09T00:00:00Z',
  targetMemberId: 'm_dst_01',
  archivedSourceMemberId: 'm_src_01',
  auditId: 'aud_merge_001',
}

const dismissResponse = {
  dismissedAt: '2026-05-09T00:00:00Z',
}

test.describe('/admin/identity-conflicts × mutation', () => {
  test('成功系: 一覧表示', async ({ adminPage }) => {
    await adminPage.goto('/admin/identity-conflicts')

    await expect(
      adminPage.getByRole('heading', { name: /Identity 重複候補/ }),
    ).toBeVisible()

    await expect(adminPage.getByText('conflict: cf_001')).toBeVisible()
    await expect(adminPage.getByText('conflict: cf_002')).toBeVisible()

    await expect(adminPage.getByText('m_src_01')).toBeVisible()
    await expect(adminPage.getByText('m_dst_01')).toBeVisible()
    await expect(adminPage.getByText('t***@example.com')).toBeVisible()
    await expect(adminPage.getByText('h***@example.com')).toBeVisible()
    await expect(adminPage.getByText(/name, affiliation/)).toBeVisible()

    const mergeButtons = adminPage.getByRole('button', { name: 'merge' })
    await expect(mergeButtons).toHaveCount(2)
    const dismissButtons = adminPage.getByRole('button', { name: '別人マーク' })
    await expect(dismissButtons).toHaveCount(2)

    // matched fields の差異が描画されていること (cf_001 は name+affiliation, cf_002 は name のみ)
    await expect(adminPage.getByText(/matched: name, affiliation/)).toBeVisible()
    await expect(
      adminPage.getByText(/matched: name(?!, affiliation)/),
    ).toBeVisible()

    // 一覧 render 直後は idle 状態 (確認 dialog は不可視)
    await expect(adminPage.getByRole('button', { name: 'merge 実行' })).toHaveCount(0)
    await expect(
      adminPage.getByRole('button', { name: '別人として確定' }),
    ).toHaveCount(0)
  })

  test('成功系: merge', async ({ adminPage }) => {
    let postCalls = 0
    let postBody: Record<string, unknown> | null = null
    await adminPage.route(MERGE_PATTERN, async (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      postCalls += 1
      postBody = route.request().postDataJSON() as Record<string, unknown>
      // contract drift 即検出 (zod parse 失敗時は throw → test fail)
      MergeIdentityRequestZ.parse(postBody)
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mergeResponse),
      })
    })

    await adminPage.goto('/admin/identity-conflicts')
    const row = adminPage
      .getByText('conflict: cf_001')
      .locator('xpath=ancestor::li[1]')
    await row.getByRole('button', { name: 'merge' }).click()
    await row.getByRole('button', { name: '次へ' }).click()
    await row.getByRole('textbox', { name: /merge 理由/ }).fill('本人確認済')
    await row.getByRole('button', { name: 'merge 実行' }).click()

    await expect.poll(() => postCalls).toBeGreaterThanOrEqual(1)
    expect(postBody).toMatchObject({
      targetMemberId: 'm_dst_01',
      reason: '本人確認済',
    })
    // request body は MergeIdentityRequestZ shape のみ (余剰 key を持たない)
    const allowedKeys = new Set(['targetMemberId', 'reason'])
    const actualKeys = Object.keys(postBody ?? {})
    expect(actualKeys.every((k) => allowedKeys.has(k))).toBe(true)
    // legacy 命名のフィールド名が混入していないこと (drift gate)
    expect(actualKeys).not.toContain('memberId')
    // 二段階確認を経ない経路 (確認 1/2 を skip した直接 POST) は 1 回のみ
    expect(postCalls).toBe(1)
  })

  test('成功系: dismiss', async ({ adminPage }) => {
    let postCalls = 0
    let postBody: Record<string, unknown> | null = null
    await adminPage.route(DISMISS_PATTERN, async (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      postCalls += 1
      postBody = route.request().postDataJSON() as Record<string, unknown>
      DismissIdentityConflictRequestZ.parse(postBody)
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(dismissResponse),
      })
    })

    await adminPage.goto('/admin/identity-conflicts')
    const row = adminPage
      .getByText('conflict: cf_002')
      .locator('xpath=ancestor::li[1]')
    await row.getByRole('button', { name: '別人マーク' }).click()
    await row
      .getByRole('textbox', { name: /別人マーク理由/ })
      .fill('同姓同名/別組織')
    await row.getByRole('button', { name: '別人として確定' }).click()

    await expect.poll(() => postCalls).toBeGreaterThanOrEqual(1)
    expect(postBody).toMatchObject({ reason: '同姓同名/別組織' })
    // request body は DismissIdentityConflictRequestZ shape のみ
    expect(Object.keys(postBody ?? {})).toEqual(['reason'])
    expect(postCalls).toBe(1)
  })

  test('refresh 境界: merge 後に router.refresh() のみ実行され、members 詳細 fetch は発生しない', async ({
    adminPage,
  }) => {
    let memberDetailCalls = 0
    let mergeCalls = 0
    await adminPage.route(MEMBER_DETAIL_PATTERN, async (route) => {
      memberDetailCalls += 1
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      })
    })
    await adminPage.route(MERGE_PATTERN, async (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      mergeCalls += 1
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mergeResponse),
      })
    })

    await adminPage.goto('/admin/identity-conflicts')
    const row = adminPage
      .getByText('conflict: cf_001')
      .locator('xpath=ancestor::li[1]')
    await row.getByRole('button', { name: 'merge' }).click()
    await row.getByRole('button', { name: '次へ' }).click()
    await row.getByRole('textbox', { name: /merge 理由/ }).fill('refresh 境界')
    await row.getByRole('button', { name: 'merge 実行' }).click()

    await expect.poll(() => mergeCalls).toBeGreaterThanOrEqual(1)
    // server-side list 再取得後も同 URL に留まり、admin layout を保持
    await expect(adminPage).toHaveURL(/\/admin\/identity-conflicts/)
    await expect(adminPage.getByTestId('admin-shell')).toBeVisible()
    // /admin/members/:id への明示 fetch は行われない (refresh 境界)
    expect(memberDetailCalls).toBe(0)
  })
})

test.describe('/admin/identity-conflicts × authz', () => {
  test('認可: member は /login redirect (admin 専用要素は不可視)', async ({
    memberPage,
  }) => {
    await memberPage.goto('/admin/identity-conflicts').catch(() => {})
    await expect(memberPage).toHaveURL(/\/login/)
    await expect(
      memberPage.getByRole('heading', { name: /Identity 重複候補/ }),
    ).toHaveCount(0)
    await expect(memberPage.getByRole('button', { name: 'merge' })).toHaveCount(
      0,
    )
    await expect(
      memberPage.getByRole('button', { name: '別人マーク' }),
    ).toHaveCount(0)
  })

  test('認可: anonymous は /login redirect', async ({ anonymousPage }) => {
    await anonymousPage.goto('/admin/identity-conflicts').catch(() => {})
    await expect(anonymousPage).toHaveURL(/\/login/)
    await expect(
      anonymousPage.getByRole('heading', { name: /Identity 重複候補/ }),
    ).toHaveCount(0)
    await expect(
      anonymousPage.getByRole('button', { name: 'merge' }),
    ).toHaveCount(0)
  })
})
