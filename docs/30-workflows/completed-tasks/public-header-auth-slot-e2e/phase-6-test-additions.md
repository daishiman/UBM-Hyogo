# Phase 6 — テスト追加（fail-path / 回帰 guard）

## 1. fail-path TC

### TC-F01 — 無効 cookie で `/profile` redirect

```ts
test('invalid cookie cannot access /profile', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext()
  await ctx.addCookies([
    {
      name: 'authjs.session-token',
      value: 'invalid.jwt.value',
      url: baseURL ?? 'http://localhost:3000',
    },
  ])
  const page = await ctx.newPage()
  await page.goto('/profile', { waitUntil: 'domcontentloaded' })
  expect(page.url()).toMatch(/\/login(\?|$)/)
  await ctx.close()
})
```

### TC-F02 — expired JWT で `/profile` redirect

`signSessionJwt` を直接呼び `exp` を過去日時にした JWT を注入し、`/login` redirect を確認。

```ts
test('expired JWT cannot access /profile', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext()
  const expiredJwt = await signSessionJwt(AUTH_SECRET, {
    memberId: 'm-1' as MemberId,
    email: 'm-1@example.test',
    isAdmin: false,
    exp: Math.floor(Date.now() / 1000) - 60,
  })
  await ctx.addCookies([
    { name: 'authjs.session-token', value: expiredJwt, url: baseURL ?? 'http://localhost:3000' },
  ])
  const page = await ctx.newPage()
  await page.goto('/profile', { waitUntil: 'domcontentloaded' })
  expect(page.url()).toMatch(/\/login(\?|$)/)
  await ctx.close()
})
```

> 実装注: expired JWT は既存 `signSessionJwt` の `nowSeconds` / `ttlSeconds` 指定で生成する。新しい `signExpiredSession` helper は追加しない。

### TC-F03 — member cookie で `/admin` redirect

既に TC-M07 で網羅。TC-F03 は重複のため計上せず、TC-M07 と統合。

## 2. 回帰 guard TC

### TC-R01 — `data-auth-state` の literal 制約

```ts
test('header data-auth-state literal is one of guest/member/admin', async ({ page }) => {
  await page.goto('/')
  const header = page.locator(HEADER_LOCATOR).first()
  const value = await header.getAttribute('data-auth-state')
  expect(['guest', 'member', 'admin']).toContain(value)
})
```

### TC-R02 — `data-role="member-cta"` は guest で 0 件

`assertRender` 内で既に網羅（TC-G01）。明示的な regression spec として独立 TC は追加しない（重複回避）。

### TC-R03 — `data-role="public-return"` は admin shell 専用

```ts
test('public-return only exists on admin shell', async ({ page, context }) => {
  await context.clearCookies()
  await page.goto('/')
  await expect(page.locator('[data-role="public-return"]')).toHaveCount(0)
})
```

## 3. PII 非露出 guard

| 検証 | 内容 |
|------|------|
| spec 内 console.log 禁止 | lint rule `no-console` が apps/web playwright 配下にも適用されていることを Phase 9 で確認 |
| storageState JSON が log に出力されない | reporter の json-summary に cookie value が含まれないことを Phase 11 で目視 |

## 4. 追加 TC 一覧

| TC ID | 種別 | 内容 |
|-------|------|------|
| TC-F01 | fail-path | 無効 cookie で `/profile` redirect |
| TC-F02 | fail-path | expired JWT で `/profile` redirect |
| TC-R01 | regression | `data-auth-state` 3 値 literal 制約 |
| TC-R03 | regression | `public-return` は admin 専用 |

## 5. DoD（テスト追加層）

- [ ] TC-F01 / TC-F02 / TC-R01 / TC-R03 が auth-slot-coverage.spec.ts に追加されている
- [ ] fail-path で `page.url()` が `/login` にマッチ
- [ ] PII 非露出 guard が Phase 9 QA で再確認される
