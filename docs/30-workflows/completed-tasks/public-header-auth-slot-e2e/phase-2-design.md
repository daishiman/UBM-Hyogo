# Phase 2 — 設計

## 1. ファイル構成

```
apps/web/playwright/
├── tests/
│   ├── auth-slot-coverage.spec.ts        # 新規・21 ケース本体
│   └── setup-auth.spec.ts                # 新規・storageState 3 種生成
├── .auth/                                # 新規ディレクトリ・.gitignore で除外
│   ├── guest.json
│   ├── member.json
│   └── admin.json
├── fixtures/
│   └── auth.ts                           # 既存・再利用のみ（変更なし）
└── playwright.config.ts                  # projects に setup-auth / auth-slot-coverage 追加
.github/workflows/
└── playwright-smoke.yml                  # matrix に auth-slot-coverage job 追加
```

## 2. storageState 生成戦略

### 2.1 既存資産の再利用

`apps/web/playwright/fixtures/auth.ts` に既に以下が存在：

| 関数 | 内容 |
|------|------|
| `signSessionJwt(secret, payload)` | `@ubm-hyogo/shared` から再エクスポート |
| `addSessionCookie(ctx, payload, baseURL)` | session cookie を BrowserContext に注入 |
| `adminLogin(ctx)` | admin-1 session cookie |
| `memberLogin(ctx)` | m-1 session cookie |

これらを `setup-auth.spec.ts` から再利用し、`context.storageState({ path })` で 3 種の JSON を出力する。

### 2.2 setup-auth.spec.ts 設計（疑似コード）

```ts
import { test as setup } from '@playwright/test'
import { adminLogin, memberLogin } from '../fixtures/auth'

setup('guest storageState', async ({ context }) => {
  // cookie 注入なし
  await context.storageState({ path: 'playwright/.auth/guest.json' })
})

setup('member storageState', async ({ context }) => {
  await memberLogin(context)
  await context.storageState({ path: 'playwright/.auth/member.json' })
})

setup('admin storageState', async ({ context }) => {
  await adminLogin(context)
  await context.storageState({ path: 'playwright/.auth/admin.json' })
})
```

## 3. auth-slot-coverage.spec.ts 設計

### 3.1 ROUTES 定義（DRY）

```ts
type State = 'guest' | 'member' | 'admin'
type Expectation = State | 'redirect'

interface Route {
  path: string
  expect: Record<State, Expectation>
}

const ROUTES: readonly Route[] = [
  { path: '/',          expect: { guest: 'guest', member: 'member', admin: 'admin' } },
  { path: '/members',   expect: { guest: 'guest', member: 'member', admin: 'admin' } },
  { path: '/register',  expect: { guest: 'guest', member: 'member', admin: 'admin' } },
  { path: '/privacy',   expect: { guest: 'guest', member: 'member', admin: 'admin' } },
  { path: '/terms',     expect: { guest: 'guest', member: 'member', admin: 'admin' } },
  { path: '/profile',   expect: { guest: 'redirect', member: 'member', admin: 'admin' } },
  { path: '/admin',     expect: { guest: 'redirect', member: 'redirect', admin: 'admin' } },
] as const
```

### 3.2 selector chain（fallback）

ヘッダ root は describe 単位で異なるため fallback chain で取得：

```ts
const HEADER_LOCATOR = '[data-component="public-header"], [data-testid="member-header"], [data-route-group="admin"]'
```

`.first()` で先頭のみ評価し、`toHaveAttribute('data-auth-state', expected)` で検証。

## 4. playwright.config.ts 追加 projects

```ts
{
  name: 'setup-auth',
  testMatch: /setup-auth\.spec\.ts$/,
},
{
  name: 'auth-slot-coverage',
  testMatch: /auth-slot-coverage\.spec\.ts$/,
  dependencies: ['setup-auth'],
  use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
},
```

既存 `desktop-chromium` / `visual-chromium` 等の `testIgnore` に `auth-slot-coverage.spec.ts` / `setup-auth.spec.ts` を追加し、二重実行を防ぐ。

## 5. CI matrix 追加（playwright-smoke.yml）

```yaml
auth-slot:
  name: auth-slot (chromium, 25 cases)
  runs-on: ubuntu-latest
  needs: smoke
  if: github.event_name != 'schedule'
  timeout-minutes: 15
  steps:
    - uses: actions/checkout@v4
    - uses: jdx/mise-action@v2
    - name: Install deps
      run: mise exec -- pnpm install --frozen-lockfile
    - name: Install Chromium
      run: mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium
    - name: Run auth-slot coverage
      run: |
        mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
          --project=setup-auth --project=auth-slot-coverage
    - name: Upload report
      if: failure()
      uses: actions/upload-artifact@v4
      with:
        name: auth-slot-report
        path: apps/web/playwright-report
        if-no-files-found: ignore
```

`needs: smoke` で既存 19-route smoke 完了後に走らせ、preflight として `setup-auth` 成功（both-or-none）を前提化する。

## 6. .gitignore 追加

```
apps/web/playwright/.auth/
```

storageState JSON は実行時生成物なのでコミット禁止。

## 7. 設計上の判断記録

| 論点 | 採用案 | 棄却案 |
|------|--------|--------|
| storageState の出力場所 | `playwright/.auth/*.json`（既存 `staging-visual-authenticated` と同パターン） | `tests/__storage__/*` |
| guest storageState の生成 | cookie なしで `storageState` を吐く（明示的に空 cookie の状態を凍結） | runtime に毎回 newContext |
| admin shell selector | `[data-route-group="admin"]` 親 div に `data-auth-state="admin"` 付与 | `data-testid="admin-shell"` 単独 |
| ROUTES の管理 | spec ファイル内 `const` で定義（DRY、型安全） | 外部 JSON |
