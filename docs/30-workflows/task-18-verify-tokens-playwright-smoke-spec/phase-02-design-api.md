[実装区分: 実装仕様書]

# Phase 2: API / 関数シグネチャ設計 — task-18 verify-tokens & playwright-smoke

## 1. ヘッダー

| 項目 | 値 |
|------|----|
| Task ID | `task-18-verify-tokens-and-playwright-smoke` |
| Phase | 2 / 13（API / 関数シグネチャ設計） |
| 目的 | verify-design-tokens の型 / Playwright config 構造 / auth fixture シグネチャを確定する |
| 依存 (前) | Phase 1（要件定義） |
| 依存 (後) | Phase 3（アーキテクチャ）、Phase 4（テスト戦略） |
| 想定工数 | 0.15 人日 |

---

## 2. ゴール / 非ゴール

### 2.1 ゴール

- `scripts/verify-design-tokens.ts` の export 型 / 関数シグネチャを確定する
- `apps/web/playwright.config.ts` の projects 構造（`smoke-chromium` / `visual-chromium`）と baseURL 切替仕様を確定する
- `apps/web/tests/e2e/fixtures/auth.ts` の `adminLogin` / `memberLogin` シグネチャを確定する
- Smoke spec の `SmokeRoute` 型とデータ駆動 loop の構造を確定する
- Visual spec の共通テンプレートを確定する

### 2.2 非ゴール

- 実装本体（function body）の記述
- CI ワークフロー YAML の構成（Phase 3 で扱う）

---

## 3. 変更対象ファイル一覧（Phase 2 で確定する API surface）

| パス | 種別 | 確定するもの |
|------|------|---------------|
| `scripts/verify-design-tokens.ts` | new | `TokenValue` / `VerifyResult` / `TokenDrift` 型、`verifyDesignTokens()` シグネチャ、出力フォーマット |
| `apps/web/playwright.config.ts` | edit | `projects[]` 構造、`baseURL` 解決順、`expect.toHaveScreenshot.maxDiffPixelRatio`、`webServer` 条件分岐 |
| `apps/web/tests/e2e/fixtures/auth.ts` | new | `adminLogin(ctx)` / `memberLogin(ctx)` の Promise<void> シグネチャ、cookie 仕様 |
| `apps/web/tests/e2e/full-smoke.spec.ts` | new | `SmokeRoute` interface、`ROUTES` const、`test.describe` ループ構造 |
| `apps/web/tests/e2e/visual/<screen>.spec.ts` | new | 共通テンプレ（goto → landmark waitFor → animation 停止 → `toHaveScreenshot`） |

---

## 4. 関数 / 型 / モジュールシグネチャ

### 4.1 `scripts/verify-design-tokens.ts`

```ts
// scripts/verify-design-tokens.ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface TokenValue {
  /** 例: "--ubm-color-accent" / "--ubm-color-ok-soft" */
  name: string;
  /** 例: "oklch(0.58 0.10 55)" / "#f5f4f1" */
  raw: string;
  /** 出現したセレクタ（":root" / "[data-theme='warm']" 等） */
  scope: string;
}

export interface VerifyResult {
  specTokens: Map<string, TokenValue>;
  cssTokens: Map<string, TokenValue>;
  drifts: TokenDrift[];
  ok: boolean;
}

export interface TokenDrift {
  key: string;
  spec: TokenValue | null;
  css: TokenValue | null;
  reason:
    | "missing-in-tokens-css"
    | "missing-in-09b"
    | "missing-theme-bridge"
    | "value-mismatch";
}

export async function verifyDesignTokens(options?: {
  specPath?: string;
  tokensCssPath?: string;
  globalsCssPath?: string;
  includeThemeBridge?: boolean;
}): Promise<VerifyResult>;
```

#### 4.1.1 実装方針（シグネチャレベルの規約）

- 09b は最初の fenced ```json``` block を抽出し、leaf の `css` / `value` pair を walk する
- `tokens.css` は CSS custom property 宣言を抽出し、09b JSON の `css` names と値を比較
- `globals.css` の `@theme inline { ... }` ブロックは中括弧マッチで切り出し、09b §10 が要求する bridge token の欠落を検査
- diff 順序は 09b JSON の宣言順
- 値の normalize: 連続空白を 1 つに圧縮（C5 ケースに対応）
- `color-mix(...)` などのネストされた式は OKLch literal として扱わない（C6 ケース）

#### 4.1.2 出力フォーマット仕様

成功時:
```
✓ design tokens in sync (N tracked)
```
（exit 0）

失敗時:
```
✗ token drift detected (3):
  --ubm-color-accent     09b: oklch(0.58 0.10 55)   tokens.css: oklch(0.58 0.10 60)   [value-mismatch]
  --ubm-color-ok-soft    09b: oklch(0.95 0.04 155)  tokens.css: <missing>             [missing-in-tokens-css]
  --color-accent         09b: required bridge        globals.css: <missing>            [missing-theme-bridge]
hint: 09b        = docs/00-getting-started-manual/specs/09b-design-tokens.md
      tokens.css = apps/web/src/styles/tokens.css
      globals    = apps/web/src/styles/globals.css (@theme inline block)
```
（exit 1）

### 4.2 `apps/web/playwright.config.ts`

```ts
import { defineConfig, devices } from '@playwright/test'

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.PLAYWRIGHT_STAGING_BASE_URL ??
  'http://localhost:3000'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000, toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['json', { outputFile: 'playwright-report/results.json' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'smoke-chromium',
      testMatch: /full-smoke\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'visual-chromium',
      testMatch: /visual\/.*\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    // 既存の desktop-chromium / firefox / mobile-webkit はそのまま残す
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : [
        {
          command: 'pnpm --filter @ubm-hyogo/web dev',
          url: 'http://localhost:3000',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      ],
})
```

確定事項:
- `baseURL` 解決順は `PLAYWRIGHT_BASE_URL` → `PLAYWRIGHT_STAGING_BASE_URL` → `http://localhost:3000`
- `expect.toHaveScreenshot.maxDiffPixelRatio = 0.02`
- 既存 project は温存し追加のみ。`testMatch` で smoke / visual を完全分離
- 外部 baseURL 指定時は `webServer` を起動しない

### 4.3 Smoke spec のデータ駆動シグネチャ

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

const ROUTES: SmokeRoute[] = [/* Phase 1 §3 の 19 routes */]
```

各 route に対する test body は次の責務を持つ:
1. `route.auth` に応じ `adminLogin` / `memberLogin` を呼ぶ
2. `page.goto(route.path, { waitUntil: 'domcontentloaded' })`
3. `response.status() < 400`
4. `route.landmark` の少なくとも 1 つが visible
5. `AxeBuilder` で `wcag2a` / `wcag2aa` を検査、`color-contrast` は除外、`serious` / `critical` の violation 0

### 4.4 Visual spec 共通テンプレ

```ts
// apps/web/tests/e2e/visual/login.spec.ts
import { test, expect } from '@playwright/test'

test('login baseline', async ({ page }) => {
  await page.goto('/login')
  await page.locator('form[data-testid="login-form"]').waitFor({ state: 'visible' })
  await page.addStyleTag({
    content: `*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }`,
  })
  await expect(page).toHaveScreenshot('login.png', { fullPage: true, maxDiffPixelRatio: 0.02 })
})
```

`/` / `/admin` / `/profile` も同型。`/admin` / `/profile` は `adminLogin` / `memberLogin` を beforeEach で呼ぶ。

### 4.5 Auth fixture シグネチャ

```ts
// apps/web/tests/e2e/fixtures/auth.ts
import type { BrowserContext } from '@playwright/test'

export async function adminLogin(ctx: BrowserContext): Promise<void>;
export async function memberLogin(ctx: BrowserContext): Promise<void>;
```

cookie 仕様:
- name: `authjs.session-token`
- value: `process.env.E2E_ADMIN_SESSION_TOKEN` / `E2E_MEMBER_SESSION_TOKEN`（未設定時は `e2e-admin-fixture` / `e2e-member-fixture`）
- domain: `new URL(PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000').hostname`
- `httpOnly: true` / `sameSite: 'Lax'` / `secure: false`
- path: `/`

---

## 5. テスト方針（Phase 2 として）

- 型 / シグネチャの妥当性は Phase 4 で確定する C1〜C7 / S1〜S5 / V1〜V3 で検証される
- `verifyDesignTokens()` は副作用なしの async 関数として設計し、CLI entry とテストの双方から呼べる

---

## 6. ローカル実行・検証コマンド

```bash
# 型チェックでシグネチャの整合を確認
mise exec -- pnpm typecheck

# 単体テスト（後段 Phase で実装）
mise exec -- pnpm vitest run scripts/verify-design-tokens.test.ts
```

---

## 7. DoD（Phase 2 完了条件）

- [ ] `TokenValue` / `VerifyResult` / `TokenDrift` の 3 型が export されている
- [ ] `verifyDesignTokens()` のオプション 4 つ（specPath / tokensCssPath / globalsCssPath / includeThemeBridge）が定義されている
- [ ] `TokenDrift.reason` が 4 値の union（value-mismatch / missing-in-tokens-css / missing-in-09b / missing-theme-bridge）に閉じている
- [ ] `playwright.config.ts` の projects 構造 / baseURL 解決順 / `maxDiffPixelRatio` が確定
- [ ] `adminLogin` / `memberLogin` の Promise<void> シグネチャと cookie 仕様が確定
- [ ] `SmokeRoute` interface と route loop の責務 5 項目が確定
- [ ] Visual spec の共通テンプレ（goto → landmark wait → animation 停止 → screenshot）が定型化
- [ ] 出力フォーマット（成功 / 失敗）の文字列仕様が確定
