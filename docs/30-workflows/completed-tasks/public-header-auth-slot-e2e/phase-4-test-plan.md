# Phase 4 — テスト計画

## 1. TC マトリクス（21 ケース）

| TC ID | state | path | 期待 | 検証内容 |
|-------|-------|------|------|----------|
| TC-G01 | guest | `/` | render | `data-auth-state="guest"` + `data-role="auth-cta"` 可視 + `data-role="member-cta"` count=0 |
| TC-G02 | guest | `/members` | render | guest 描画 |
| TC-G03 | guest | `/register` | render | guest 描画 |
| TC-G04 | guest | `/privacy` | render | guest 描画 |
| TC-G05 | guest | `/terms` | render | guest 描画 |
| TC-G06 | guest | `/profile` | redirect | `page.url()` matches `/login(\?\|$)` |
| TC-G07 | guest | `/admin` | redirect | `page.url()` matches `/login(\?\|$)` |
| TC-M01 | member | `/` | render | `data-auth-state="member"` + `data-role="member-cta"` 可視 |
| TC-M02 | member | `/members` | render | member 描画 |
| TC-M03 | member | `/register` | render | member 描画 |
| TC-M04 | member | `/privacy` | render | member 描画 |
| TC-M05 | member | `/terms` | render | member 描画 |
| TC-M06 | member | `/profile` | render | `data-auth-state="member"` + `a[href="/profile"]` 可視 |
| TC-M07 | member | `/admin` | redirect | `page.url()` matches `/login(\?\|$)` |
| TC-A01 | admin | `/` | render | `data-auth-state="admin"` + `data-role="admin-cta"` 可視 |
| TC-A02 | admin | `/members` | render | admin 描画 |
| TC-A03 | admin | `/register` | render | admin 描画 |
| TC-A04 | admin | `/privacy` | render | admin 描画 |
| TC-A05 | admin | `/terms` | render | admin 描画 |
| TC-A06 | admin | `/profile` | render | admin 描画 |
| TC-A07 | admin | `/admin` | render | `data-auth-state="admin"` + `data-role="public-return"` 可視 |

## 2. expect chain 設計

### 2.1 render 期待時

```ts
const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' })
expect(response?.ok()).toBeTruthy()
const header = page.locator(HEADER_LOCATOR).first()
await expect(header).toHaveAttribute('data-auth-state', expected)

if (expected === 'guest') {
  await expect(page.locator('[data-role="auth-cta"]')).toBeVisible()
  await expect(page.locator('[data-role="member-cta"]')).toHaveCount(0)
  await expect(page.locator('[data-role="admin-cta"]')).toHaveCount(0)
} else if (expected === 'member') {
  await expect(page.locator('[data-role="member-cta"], a[href="/profile"]').first()).toBeVisible()
  await expect(page.locator('[data-role="admin-cta"]')).toHaveCount(0)
} else if (expected === 'admin') {
  await expect(page.locator('[data-role="member-cta"], a[href="/profile"]').first()).toBeVisible()
  await expect(page.locator('[data-role="admin-cta"], a[href="/admin"]').first()).toBeVisible()
}
```

### 2.2 redirect 期待時

```ts
await page.goto(route.path, { waitUntil: 'domcontentloaded' })
expect(page.url()).toMatch(/\/login(\?|$)/)
```

### 2.3 `/admin` admin special（public-return 追加検証）

```ts
if (state === 'admin' && route.path === '/admin') {
  await expect(page.locator('[data-role="public-return"]')).toBeVisible()
}
```

## 3. fail-path 追加 TC（Phase 6 で追加）

| TC ID | 内容 |
|-------|------|
| TC-F01 | 無効 cookie（壊れた JWT）→ `/profile` で `/login` redirect |
| TC-F02 | expired JWT → `/profile` で `/login` redirect |
| TC-F03 | member cookie で `/admin` → `/login` redirect |

## 4. setup spec 検証

| 項目 | 期待 |
|------|------|
| `guest.json` ファイル存在 | `cookies: []` |
| `member.json` ファイル存在 | `authjs.session-token` cookie 1 件 |
| `admin.json` ファイル存在 | `authjs.session-token` cookie 1 件（admin payload） |

## 5. 実行コマンド

```bash
# storageState 生成
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=setup-auth

# 21 ケース実行
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=auth-slot-coverage

# 両方まとめて
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  --project=setup-auth --project=auth-slot-coverage
```

## 6. 期待される coverage

- routes × states matrix: 21 / 21 = 100%
- DOM 契約属性: `data-auth-state` 3 値 / `data-role` 4 値すべて検証経路あり
- fail-path: 3 TC で fail-closed 動作担保
