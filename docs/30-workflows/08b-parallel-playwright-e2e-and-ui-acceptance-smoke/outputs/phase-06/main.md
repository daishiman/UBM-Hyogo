# Phase 6 成果物: 異常系検証

> Phase 4 verify suite 上で発生し得る failure を 14 カテゴリで網羅し、各 spec へ test ケース化する。不変条件 #4 / #8 / #9 / #15 を異常系側からも担保する。

## 1. failure cases 一覧（14 件）

| # | カテゴリ | 発生条件 | 関連 spec | expected | 不変条件 / AC |
| --- | --- | --- | --- | --- | --- |
| F-1 | navigation timeout | API down で page load > 30s | public / login / profile / admin | timeout fail + screenshot 保存 | AC-1 |
| F-2 | login form 422 | `/auth/magic-link` 422 応答 | login.spec | toast 表示 + state=input 維持（enumeration 防止） | AC-3 |
| F-3 | AuthGateState=unregistered | 未登録 email でログイン | login.spec | unregistered block visible / `/no-access` redirect なし | #9 / AC-3 |
| F-4 | AuthGateState=rules_declined | rules 同意フラグなし | login.spec | rules_declined block visible | #9 / AC-3 |
| F-5 | AuthGateState=deleted | 削除済み user のログイン試行 | login.spec | deleted block visible | #7, #9 / AC-3 |
| F-6 | `/no-access` 直接アクセス | URL バー入力 | login.spec | `response.status() === 404` | #9 / AC-3 |
| F-7 | profile 編集 form 探索 | プロフィール画面で編集 form を探す | profile.spec | `getByRole('form', {name: /編集/}).toHaveCount(0)` | #4 / AC-4 |
| F-8 | editResponseUrl popup blocked | popup ブロッカ on | profile.spec | external nav 失敗を tolerate（warn 出力） | #4 / AC-4 |
| F-9 | mobile viewport overflow | 横スクロール発生 | 全 spec mobile | `scrollWidth ≤ clientWidth` | AC-1 / AC-7 |
| F-10 | admin に member access | member cookie で `/admin/*` | admin.spec | `response.status() === 403` | #5 / AC-5 |
| F-11 | admin に anon access | cookie なしで `/admin/*` | admin.spec | redirect `/login` | #5 / AC-5 |
| F-12 | attendance dup register | 同 member 2 回連続登録 | attendance.spec | toast `既に出席登録済み`、UNIQUE 違反吸収 | #15 |
| F-13 | a11y violation | aria-* / contrast 違反 | public / login / profile / admin | `violations.length === 0` | AC-8 |
| F-14 | reload 後 state 喪失 | localStorage 依存実装の検出 | profile.spec | reload + `localStorage.clear()` 後も state 維持 | #8 |

## 2. category × spec マトリクス

| カテゴリ | public | login | profile | admin | search | density | attendance |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-1 timeout | ✓ | ✓ | ✓ | ✓ | — | — | — |
| F-2 form 422 | — | ✓ | — | — | — | — | — |
| F-3 unregistered | — | ✓ | — | — | — | — | — |
| F-4 rules_declined | — | ✓ | — | — | — | — | — |
| F-5 deleted | — | ✓ | — | — | — | — | — |
| F-6 /no-access 404 | — | ✓ | — | — | — | — | — |
| F-7 profile 編集なし | — | — | ✓ | — | — | — | — |
| F-8 popup blocked | — | — | ✓ | — | — | — | — |
| F-9 mobile overflow | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| F-10 admin authz (member) | — | — | — | ✓ | — | — | — |
| F-11 admin authz (anon) | — | — | — | ✓ | — | — | — |
| F-12 attendance dup | — | — | — | — | — | — | ✓ |
| F-13 a11y | ✓ | ✓ | ✓ | ✓ | — | — | — |
| F-14 reload state | — | — | ✓ | — | — | — | — |

## 3. 特例 test 定義

### 3.1 navigation timeout (F-1)

```ts
test('API down で navigation が timeout fail する', async ({ page }) => {
  await page.route('**/api/**', route => route.abort('timedout'))
  await expect(page.goto('/members', { timeout: 30_000 })).rejects.toThrow()
})
```

### 3.2 login form 422 (F-2)

```ts
test('magic-link 422 でも state=input に留まり enumeration を起こさない', async ({ page }) => {
  await page.route('**/auth/magic-link', route =>
    route.fulfill({ status: 422, body: JSON.stringify({ error: 'invalid' }) }))
  await page.goto('/login')
  await page.getByLabel('メールアドレス').fill('foo@example.com')
  await page.getByRole('button', { name: /送信/ }).click()
  await expect(page.getByTestId('auth-gate-input')).toBeVisible()
  await expect(page.getByText(/送信に失敗/)).toBeVisible()
})
```

### 3.3 AuthGateState 5 状態 + `/no-access` 不在 (F-3〜F-6, 不変条件 #9)

```ts
const states = ['input', 'sent', 'unregistered', 'rules_declined', 'deleted'] as const
for (const state of states) {
  test(`AuthGateState=${state} block 表示`, async ({ page }) => {
    await page.goto(`/login?test_state=${state}`)
    await expect(page.getByTestId(`auth-gate-${state}`)).toBeVisible()
  })
}

test('/no-access route does not exist (#9)', async ({ page }) => {
  const res = await page.goto('/no-access')
  expect(res?.status()).toBe(404)
})
```

### 3.4 profile 編集 form 不在 + editResponseUrl 遷移 (F-7, F-8, 不変条件 #4)

```ts
test('profile に編集 form が存在しない (#4)', async ({ memberPage }) => {
  await memberPage.goto('/profile')
  await expect(memberPage.getByRole('form', { name: /プロフィール編集/ })).toHaveCount(0)
  await expect(memberPage.getByRole('textbox', { name: /自己紹介/ })).toHaveCount(0)
})

test('editResponseUrl で popup → forms.google.com viewform (#4)', async ({ memberPage, context }) => {
  await memberPage.goto('/profile')
  const popupPromise = context.waitForEvent('page')
  await memberPage.getByRole('link', { name: /回答を編集/ }).click()
  const popup = await popupPromise
  await expect(popup).toHaveURL(/docs\.google\.com\/forms\/d\/e\/.+\/viewform/)
})
```

### 3.5 mobile viewport overflow (F-9)

```ts
test.describe('mobile overflow guard', () => {
  for (const path of ['/', '/members', '/members/m-1', '/register', '/login', '/profile']) {
    test(`${path} で横スクロールが発生しない`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(path)
      const sw = await page.evaluate(() => document.documentElement.scrollWidth)
      const cw = await page.evaluate(() => document.documentElement.clientWidth)
      expect(sw).toBeLessThanOrEqual(cw)
    })
  }
})
```

### 3.6 認可境界 403 / `/login` redirect (F-10, F-11, 不変条件 #5)

```ts
const adminPaths = ['/admin', '/admin/members', '/admin/tags', '/admin/schema', '/admin/meetings']
for (const p of adminPaths) {
  test(`member が ${p} にアクセスすると 403`, async ({ memberPage }) => {
    const res = await memberPage.goto(p)
    expect(res?.status()).toBe(403)
  })
  test(`anonymous が ${p} にアクセスすると /login redirect`, async ({ page }) => {
    await page.goto(p)
    await expect(page).toHaveURL(/\/login/)
  })
}
```

### 3.7 attendance 二重防御 (F-12, 不変条件 #15)

```ts
test('attendance dup register で toast (#15 二重防御)', async ({ adminPage }) => {
  await adminPage.goto('/admin/meetings/sess-1')
  const btn = adminPage.getByRole('button', { name: /m-1.+出席登録/ })
  await btn.click()
  await btn.click()
  await expect(adminPage.getByText(/既に出席登録済み/)).toBeVisible()
})

test('削除済み member は出席候補から除外 (#15 + #7)', async ({ adminPage }) => {
  await adminPage.goto('/admin/meetings/sess-1')
  await expect(adminPage.getByTestId('attendance-candidates'))
    .not.toContainText('削除済みユーザー')
})
```

### 3.8 a11y violation (F-13)

```ts
for (const path of ['/', '/members', '/login', '/profile', '/admin']) {
  test(`${path} で WCAG 2.1 AA 主要違反 0`, async ({ adminPage }) => {
    await adminPage.goto(path)
    const violations = await runAxe(adminPage)
    expect(violations).toEqual([])
  })
}
```

### 3.9 reload 後 state 維持 (F-14, 不変条件 #8)

```ts
test('profile reload + localStorage.clear() でも state 維持 (#8)', async ({ memberPage }) => {
  await memberPage.goto('/profile')
  await expect(memberPage.getByText(/ようこそ/)).toBeVisible()
  await memberPage.reload()
  await expect(memberPage.getByText(/ようこそ/)).toBeVisible()
  await memberPage.evaluate(() => localStorage.clear())
  await memberPage.reload()
  await expect(memberPage.getByText(/ようこそ/)).toBeVisible()
})
```

## 4. 不変条件カバレッジ（異常系側）

| 不変条件 | failure カテゴリ | test |
| --- | --- | --- |
| #4 profile 編集 form 不在 | F-7 / F-8 | `getByRole('form').toHaveCount(0)` + popup → viewform |
| #5 admin 認可境界 | F-10 / F-11 | 403 + `/login` redirect |
| #7 削除済み member 除外 | F-5 / F-12 (削除済み除外) | login.deleted block + attendance candidates |
| #8 reload 後 state 維持 | F-14 | reload + `localStorage.clear()` |
| #9 `/no-access` 不在 + AuthGateState 出し分け | F-3〜F-6 | 5 state visible + 404 |
| #15 attendance 二重防御 | F-12 | dup toast + 削除済み非表示 |

## 5. Phase 連携

| 連携先 | 引き継ぎ |
| --- | --- |
| Phase 4 verify suite | 14 failure を spec 内 test ケースに反映 |
| Phase 7 AC matrix | failure × AC × invariant 紐付け |
| 下流 09a smoke | staging で同 failure 再現可能性を verify |

## 完了条件

- [x] failure cases 14 件（≥ 12）
- [x] category × spec matrix
- [x] 特例 test 9 種定義（要件 6 種を超過）
- [x] 不変条件 #4 / #5 / #7 / #8 / #9 / #15 をすべてトレース
