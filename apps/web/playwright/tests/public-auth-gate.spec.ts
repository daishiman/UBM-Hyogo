// require-auth-public-access-gate: 公開層は全ルート認証必須化。
// 未認証で公開ルートへアクセスすると (public)/layout が children を返さず
// LoginRequiredNotice を描画する（リダイレクトはしない・in-place 案内）。
// /login だけは認証不要で通常表示される。

import { expect, test } from '../fixtures/auth'

// 認証ゲート配下の公開ルート（/login を除く公開 6 ルート）。
const GATED_PUBLIC_ROUTES = [
  '/',
  '/members',
  '/members/sample-001',
  '/register',
  '/privacy',
  '/terms',
]

for (const path of GATED_PUBLIC_ROUTES) {
  test(`auth gate: 未認証で ${path} は LoginRequiredNotice を表示する`, async ({ page, mockApi }) => {
    void mockApi
    // ログインしない（未認証のまま訪問）
    await page.goto(path, { waitUntil: 'domcontentloaded' })

    const notice = page.locator('[data-testid="login-required-notice"]')
    await notice.waitFor({ state: 'visible', timeout: 10_000 })
    await expect(notice).toBeVisible()

    // 公開コンテンツ shell は描画されない（fail-closed）。
    await expect(page.locator('[data-testid="public-shell"]')).toHaveCount(0)

    // ログイン導線は /login へ redirect クエリ付きで誘導する。
    const cta = page.locator('[data-testid="login-required-notice-cta"]')
    await expect(cta).toBeVisible()
    await expect(cta).toHaveAttribute('href', /^\/login\?redirect=/)
  })
}

test('auth gate: /login は未認証でも表示される', async ({ page, mockApi }) => {
  void mockApi
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('[data-testid="login-required-notice"]')).toHaveCount(0)
  await expect(page.locator('main h1').first()).toBeVisible()
})
