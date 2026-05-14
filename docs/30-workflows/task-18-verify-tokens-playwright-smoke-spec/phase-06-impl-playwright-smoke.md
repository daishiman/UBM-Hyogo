[実装区分: 実装仕様書]

# Phase 6: Playwright 19 routes smoke 実装仕様

## 1. ヘッダー

| 項目 | 値 |
|------|----|
| Phase | 6 / 13 |
| 目的 | 19 routes（公開 6 / 会員 4 / 管理 8 / 共通 1）の HTTP status / landmark visible / a11y violation を data-driven に検証する Playwright smoke spec と auth fixture を実装する |
| 前提 Phase | Phase 1（19 routes 確定）/ Phase 2（変更対象ファイル表）/ Phase 5（gate self-test 完了） |
| 想定工数 | 0.25 人日 |

## 2. ゴール / 非ゴール

### 2.1 ゴール

1. `apps/web/tests/e2e/full-smoke.spec.ts` が 19 routes を data-driven に巡回し、各 route で
   - HTTP status < 400
   - 主要 landmark（`route.landmark[]` のうち 1 つ）が visible
   - axe-core で `serious` / `critical` の violation 0 件
   を満たすことを assert する。
2. `apps/web/tests/e2e/fixtures/auth.ts` に `adminLogin(ctx)` / `memberLogin(ctx)` を実装し、`authjs.session-token` を `addCookies()` で注入する。
3. 19 routes のうち `skip: true` フラグは 0 件にする（fixture が出揃っているため）。

### 2.2 非ゴール

- visual diff（Phase 7）
- cross-browser matrix（firefox / webkit）の必須化
- color-contrast a11y 検証（token Phase で担保）
- 新規 endpoint の追加・既存 endpoint の改変

## 3. 変更対象ファイル一覧

| パス | 種別 | 説明 |
|------|------|------|
| `apps/web/tests/e2e/full-smoke.spec.ts` | new | 19 routes data-driven smoke |
| `apps/web/tests/e2e/fixtures/auth.ts` | new | `adminLogin` / `memberLogin`（cookie 注入） |

## 4. 関数・型シグネチャ

### 4.1 `SmokeRoute` 型と route 表

```ts
// apps/web/tests/e2e/full-smoke.spec.ts (抜粋)
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { adminLogin, memberLogin } from './fixtures/auth'

interface SmokeRoute {
  path: string
  auth: 'public' | 'member' | 'admin'
  /** 主要 landmark のセレクタ。複数のうちいずれか 1 つが visible なら OK */
  landmark: string[]
  /** 200 でなく 302 redirect が期待値の場合に指定 */
  expectRedirectTo?: RegExp
  /** smoke で skip する route（fixture 整備中など） */
  skip?: boolean
}

const ROUTES: SmokeRoute[] = [
  { path: '/', auth: 'public', landmark: ['main h1', '[data-testid="public-hero"]'] },
  { path: '/members', auth: 'public', landmark: ['main h1', '[data-testid="member-grid"]'] },
  { path: '/members/sample-001', auth: 'public', landmark: ['main h1'] },
  { path: '/about', auth: 'public', landmark: ['main h1'] },
  { path: '/rules', auth: 'public', landmark: ['main h1'] },
  { path: '/contact', auth: 'public', landmark: ['main h1'] },
  { path: '/login', auth: 'public', landmark: ['form[data-testid="login-form"]'] },
  { path: '/login?state=sent', auth: 'public', landmark: ['[data-testid="login-state-sent"]'] },
  { path: '/login?state=unregistered', auth: 'public', landmark: ['[data-testid="login-state-unregistered"]'] },
  { path: '/profile', auth: 'member', landmark: ['main h1'] },
  { path: '/admin', auth: 'admin', landmark: ['[data-testid="admin-dashboard"]'] },
  { path: '/admin/members', auth: 'admin', landmark: ['[data-testid="admin-members-table"]'] },
  { path: '/admin/tags', auth: 'admin', landmark: ['[data-testid="admin-tags"]'] },
  { path: '/admin/meetings', auth: 'admin', landmark: ['[data-testid="admin-meetings"]'] },
  { path: '/admin/schema', auth: 'admin', landmark: ['[data-testid="admin-schema"]'] },
  { path: '/admin/requests', auth: 'admin', landmark: ['[data-testid="admin-requests"]'] },
  { path: '/admin/identity-conflicts', auth: 'admin', landmark: ['[data-testid="admin-id-conflicts"]'] },
  { path: '/admin/audit', auth: 'admin', landmark: ['[data-testid="admin-audit"]'] },
  { path: '/__not_found_canary', auth: 'public', landmark: ['[data-testid="not-found"]'] },
]
```

### 4.2 各 route の test 本体

```ts
for (const route of ROUTES) {
  test.describe(`smoke: ${route.path} (${route.auth})`, () => {
    test.skip(!!route.skip, 'fixture 未整備')

    test('returns 200 + landmark visible + a11y clean', async ({ page, context }) => {
      if (route.auth === 'admin') await adminLogin(context)
      if (route.auth === 'member') await memberLogin(context)

      const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' })
      expect(response, `no response for ${route.path}`).not.toBeNull()
      expect(response!.status(), `${route.path} status`).toBeLessThan(400)

      const visible = await Promise.any(
        route.landmark.map((sel) => page.locator(sel).first().waitFor({ state: 'visible', timeout: 10_000 })),
      )
      expect(visible).toBeUndefined()

      const a11y = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .disableRules(['color-contrast'])
        .analyze()
      const blocking = a11y.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
      expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([])
    })
  })
}
```

### 4.3 `fixtures/auth.ts`

```ts
// apps/web/tests/e2e/fixtures/auth.ts
import type { BrowserContext } from '@playwright/test'

export async function adminLogin(ctx: BrowserContext): Promise<void> {
  await ctx.addCookies([
    {
      name: 'authjs.session-token',
      value: process.env.E2E_ADMIN_SESSION_TOKEN ?? 'e2e-admin-fixture',
      domain: new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000').hostname,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      secure: false,
    },
  ])
}

export async function memberLogin(ctx: BrowserContext): Promise<void> {
  await ctx.addCookies([
    {
      name: 'authjs.session-token',
      value: process.env.E2E_MEMBER_SESSION_TOKEN ?? 'e2e-member-fixture',
      domain: new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000').hostname,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      secure: false,
    },
  ])
}
```

## 5. テスト方針（Phase 6 内で動くテスト）

`apps/web/tests/e2e/full-smoke.spec.ts` 自身が gate の本体。Phase 内では以下の self-test を手動で 1 回回す（PR レビュー時の確認項目）:

| ID | 仕掛け | 期待 |
|----|--------|------|
| S1 | 全 route 200 | 19 route 全 PASS |
| S2 | `/admin/audit` を一時的に throw | 1 件 fail / exit 1 |
| S3 | `/login` の `<input>` から `<label>` を一時削除 | a11y serious で fail |
| S4 | `/profile` の `<main>` を一時削除 | landmark waitFor で timeout fail |
| S5 | 未認証で `/profile` 訪問 | `auth: 'member'` fixture 未注入時に redirect / fail |

## 6. ローカル実行・検証コマンド

```bash
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium

# local dev server を Playwright が自動起動
mise exec -- pnpm --filter @ubm-hyogo/web e2e:smoke

# staging 等の外部 baseURL に対して実行
PLAYWRIGHT_BASE_URL=https://staging.ubm-hyogo.example \
  mise exec -- pnpm --filter @ubm-hyogo/web e2e:smoke

# レポート
open apps/web/playwright-report/index.html
```

## 7. DoD チェックリスト

- [ ] `full-smoke.spec.ts` の `ROUTES` が 19 件（`skip: true` 0 件）
- [ ] 各 route で HTTP status / landmark / a11y の 3 観点を assert
- [ ] `adminLogin` / `memberLogin` が `authjs.session-token` を `domain` 動的解決で注入
- [ ] `@axe-core/playwright` で `color-contrast` は `disableRules` で除外、`serious` / `critical` のみ blocking
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web e2e:smoke` が 19 routes 全 PASS（ローカル）
- [ ] `E2E_ADMIN_SESSION_TOKEN` / `E2E_MEMBER_SESSION_TOKEN` 未設定時もローカルでフィクスチャ値で動作
